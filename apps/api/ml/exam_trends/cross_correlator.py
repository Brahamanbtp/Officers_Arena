import numpy as np
import logging
from typing import List, Dict, Any

logger = logging.getLogger("ml.exam_trends.correlator")

class CrossExamCorrelator:
    """
    CrossExamCorrelator analyzes trend correlations between CDS and UPSC,
    treating CDS as a leading indicator for UPSC exam topics.
    """

    @staticmethod
    def calculate_lagged_correlation(cds_trends: List[float], upsc_trends: List[float]) -> float:
        """
        Computes the Pearson correlation between CDS subject trends at year T-1 
        and UPSC subject trends at year T.
        
        Args:
            cds_trends: Chronological frequency/trend vector for CDS.
            upsc_trends: Chronological frequency/trend vector for UPSC.
            
        Returns:
            float: Pearson correlation coefficient r.
        """
        if len(cds_trends) < 3 or len(upsc_trends) != len(cds_trends):
            return 0.0
            
        # Align CDS(T-1) with UPSC(T)
        cds_lagged = np.array(cds_trends[:-1])
        upsc_current = np.array(upsc_trends[1:])
        
        std_cds = np.std(cds_lagged)
        std_upsc = np.std(upsc_current)
        
        if std_cds == 0.0 or std_upsc == 0.0:
            return 0.0
            
        r = np.corrcoef(cds_lagged, upsc_current)[0, 1]
        return float(r) if not np.isnan(r) else 0.0

    @staticmethod
    def calculate_leading_indicator_factor(
        cds_recent_freq: int,
        upsc_recent_freq: int,
        cds_historical_avg: float,
        upsc_historical_avg: float
    ) -> float:
        """
        UPSC Leading Indicator Check:
        If a topic spiked in CDS recently (above its average) but hasn't yet 
        increased in UPSC (below or equal to its average), we apply a 1.2x urgency boost.
        
        Returns:
            float: Synergy weight multiplier (1.2x if active leading indicator, else 1.0x).
        """
        spiked_in_cds = cds_recent_freq > cds_historical_avg
        dormant_in_upsc = upsc_recent_freq <= upsc_historical_avg
        
        if spiked_in_cds and dormant_in_upsc:
            logger.info("CDS-to-UPSC Leading Indicator detected: Applying 1.2x Urgency Boost.")
            return 1.2
            
        return 1.0
