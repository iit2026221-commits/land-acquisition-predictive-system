double baseline_risk_score(double normalized_cost, double parcel_count) {
    return normalized_cost + parcel_count * 0.02;
}

