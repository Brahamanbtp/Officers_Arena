import numpy as np
from typing import List, Dict, Any, Tuple
import logging

try:
    from sklearn.cluster import KMeans
except ImportError:
    # Fallback mock KMeans if sklearn is missing (highly unlikely but safeguards execution)
    class KMeans:
        def __init__(self, n_clusters=3, random_state=42):
            self.n_clusters = n_clusters
        def fit(self, X):
            self.labels_ = np.zeros(len(X), dtype=int)
            self.cluster_centers_ = np.zeros((self.n_clusters, X.shape[1]))
            return self

logger = logging.getLogger("ml.exam_trends.drift")

class TrendAnalyzer:
    """
    TrendAnalyzer computes Semantic Drift over years and clusters question embeddings 
    to map syllabus and topic shifts.
    """

    @staticmethod
    def cosine_similarity(v1: np.ndarray, v2: np.ndarray) -> float:
        """
        Calculates cosine similarity between two vectors.
        """
        norm1 = np.linalg.norm(v1)
        norm2 = np.linalg.norm(v2)
        if norm1 == 0.0 or norm2 == 0.0:
            return 0.0
        return float(np.dot(v1, v2) / (norm1 * norm2))

    @classmethod
    def calculate_centroid(cls, embeddings: List[np.ndarray]) -> np.ndarray:
        """
        Calculates the mean centroid vector of a list of embeddings.
        """
        if not embeddings:
            return np.zeros(1536)  # Default OpenAI embedding size
        return np.mean(embeddings, axis=0)

    @classmethod
    def analyze_drift(cls, yearly_embeddings: Dict[int, List[np.ndarray]]) -> Dict[str, Any]:
        """
        Measures semantic drift index (1.0 - CosineSimilarity) between consecutive years.
        
        Args:
            yearly_embeddings: Dict mapping year (int) to list of question embeddings (np.ndarray).
            
        Returns:
            Dict containing consecutive yearly drift scores and trend line coordinates.
        """
        sorted_years = sorted(yearly_embeddings.keys())
        drift_results = []
        centroids = {}
        
        # 1. Compute yearly centroids
        for year in sorted_years:
            embs = yearly_embeddings[year]
            if embs:
                centroids[year] = cls.calculate_centroid(embs)
                
        # 2. Compute drift between consecutive years
        for i in range(1, len(sorted_years)):
            prev_year = sorted_years[i-1]
            curr_year = sorted_years[i]
            
            c_prev = centroids.get(prev_year)
            c_curr = centroids.get(curr_year)
            
            if c_prev is not None and c_curr is not None:
                sim = cls.cosine_similarity(c_prev, c_curr)
                drift_index = round(1.0 - sim, 6)
                drift_results.append({
                    "from_year": prev_year,
                    "to_year": curr_year,
                    "similarity": round(sim, 6),
                    "drift_index": drift_index
                })
                
        return {
            "drift_timeline": drift_results,
            "years_analyzed": sorted_years
        }

    @classmethod
    def identify_topic_shifts(
        self,
        embeddings: List[np.ndarray],
        years: List[int],
        n_clusters: int = 3
    ) -> Dict[str, Any]:
        """
        Uses K-Means clustering to analyze if sub-topic distributions shift across years.
        
        Args:
            embeddings: List of question embeddings.
            years: Corresponding list of years for each embedding.
            n_clusters: Number of latent topic clusters.
            
        Returns:
            Dict structured for Radar charts and cluster shifts.
        """
        if not embeddings or len(embeddings) < n_clusters:
            return {"error": "Insufficient data to perform K-Means clustering"}

        X = np.array(embeddings)
        kmeans = KMeans(n_clusters=n_clusters, random_state=42)
        kmeans.fit(X)
        labels = kmeans.labels_
        
        # Track cluster occurrence per year
        unique_years = sorted(list(set(years)))
        cluster_distribution: Dict[int, List[int]] = {yr: [0]*n_clusters for yr in unique_years}
        
        for yr, label in zip(years, labels):
            cluster_distribution[yr][label] += 1
            
        # Convert to percentage-based distributions for Radar chart consistency
        radar_chart_data = []
        for yr in unique_years:
            counts = cluster_distribution[yr]
            total = sum(counts)
            percentages = [round((c / total) * 100.0, 2) if total > 0 else 0.0 for c in counts]
            radar_chart_data.append({
                "year": yr,
                "distribution": percentages,
                "counts": counts
            })
            
        return {
            "n_clusters": n_clusters,
            "radar_data": radar_chart_data,
            "cluster_centers": kmeans.cluster_centers_.tolist()
        }
