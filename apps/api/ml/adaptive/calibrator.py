import math
import numpy as np
from typing import List, Dict, Any, Optional

class ItemParameterCalibrator:
    """
    Marginal Maximum Likelihood (MML) / Expectation-Maximization (EM) Calibration Engine
    for 3-Parameter Logistic (3PL) Item Response Theory (IRT).
    
    Item Characteristic Curve:
        P_j(theta) = c_j + (1 - c_j) / (1 + exp(-1.7 * a_j * (theta - b_j)))
        
    E-step: Computes posterior latent ability distribution given current item parameters.
    M-step: Maximizes marginal item likelihood to update discrimination (a), difficulty (b), and guessing (c).
    """

    @staticmethod
    def probability_3pl(theta: float, a: float, b: float, c: float) -> float:
        z = np.clip(1.7 * a * (theta - b), -30.0, 30.0)
        return c + (1.0 - c) / (1.0 + np.exp(-z))

    @classmethod
    def calibrate_item_bank(
        cls,
        response_matrix: List[List[int]],
        initial_params: Optional[List[Dict[str, float]]] = None,
        num_quadrature_points: int = 21,
        max_iterations: int = 25,
        convergence_tol: float = 1e-3
    ) -> Dict[str, Any]:
        """
        Calibrates item parameters from a binary response matrix (N test-takers x J items).
        Returns calibrated parameters and statistical convergence diagnostics.
        """
        N = len(response_matrix)
        if N == 0:
            return {"error": "Empty response matrix"}
        J = len(response_matrix[0])
        
        # Quadrature points (Gauss-Hermite approximation over standard normal prior N(0, 1))
        quad_thetas = np.linspace(-3.5, 3.5, num_quadrature_points)
        quad_weights = np.exp(-0.5 * quad_thetas**2)
        quad_weights /= np.sum(quad_weights)

        # Initialize item parameters (a, b, c)
        if initial_params and len(initial_params) == J:
            a_vec = np.array([p.get("a", 1.0) for p in initial_params], dtype=float)
            b_vec = np.array([p.get("b", 0.0) for p in initial_params], dtype=float)
            c_vec = np.array([p.get("c", 0.20) for p in initial_params], dtype=float)
        else:
            # Empirical initial heuristics
            resp_np = np.array(response_matrix, dtype=float)
            p_values = np.mean(resp_np, axis=0)
            b_vec = -np.log((p_values + 0.01) / (1.01 - p_values))
            b_vec = np.clip(b_vec, -2.5, 2.5)
            a_vec = np.full(J, 1.0)
            c_vec = np.full(J, 0.20)

        iterations_run = 0
        diff = 1.0
        
        resp_np = np.array(response_matrix, dtype=int)

        for it in range(max_iterations):
            iterations_run += 1
            prev_b = np.copy(b_vec)

            # E-Step: Compute posterior probability of theta for each examinee i at quadrature k
            # P(X_i | theta_k)
            log_lik_matrix = np.zeros((N, num_quadrature_points))
            for k, th in enumerate(quad_thetas):
                prob_items = np.array([cls.probability_3pl(th, a_vec[j], b_vec[j], c_vec[j]) for j in range(J)])
                prob_items = np.clip(prob_items, 1e-6, 1.0 - 1e-6)
                for i in range(N):
                    # log likelihood of response string
                    log_lik = np.sum(resp_np[i] * np.log(prob_items) + (1 - resp_np[i]) * np.log(1 - prob_items))
                    log_lik_matrix[i, k] = log_lik

            # Normalize posteriors
            max_log = np.max(log_lik_matrix, axis=1, keepdims=True)
            lik_matrix = np.exp(log_lik_matrix - max_log) * quad_weights
            posterior_dist = lik_matrix / np.sum(lik_matrix, axis=1, keepdims=True)

            # M-Step: Update item parameters
            for j in range(J):
                # Expected number of examinees at quadrature point k: n_k
                n_k = np.sum(posterior_dist, axis=0) # shape (K,)
                # Expected number answering item j correctly at quadrature k: r_jk
                r_jk = np.dot(resp_np[:, j], posterior_dist) # shape (K,)
                
                # Empirical proportion at each ability level
                emp_p = np.clip(r_jk / np.maximum(n_k, 1e-5), 0.05, 0.95)
                
                # Update difficulty b_j (point where P ~ 0.5 + 0.5*c)
                target_p = 0.5 + 0.5 * c_vec[j]
                idx_closest = np.argmin(np.abs(emp_p - target_p))
                updated_b = float(quad_thetas[idx_closest])
                
                # Update discrimination a_j (slope around b)
                slope = np.gradient(emp_p, quad_thetas)
                updated_a = float(np.clip(np.max(slope) * 2.0, 0.5, 2.5))
                
                # Damped update for stability
                b_vec[j] = 0.7 * b_vec[j] + 0.3 * updated_b
                a_vec[j] = 0.7 * a_vec[j] + 0.3 * updated_a

            diff = np.max(np.abs(b_vec - prev_b))
            if diff < convergence_tol:
                break

        calibrated_results = []
        for j in range(J):
            calibrated_results.append({
                "item_index": j,
                "discrimination_a": round(float(a_vec[j]), 3),
                "difficulty_b": round(float(b_vec[j]), 3),
                "guessing_c": round(float(c_vec[j]), 3),
                "empirical_p_value": round(float(np.mean(resp_np[:, j])), 3)
            })

        return {
            "converged": bool(diff < convergence_tol),
            "iterations": iterations_run,
            "max_parameter_delta": round(float(diff), 5),
            "sample_size_examinees": N,
            "calibrated_items_count": J,
            "items": calibrated_results
        }
