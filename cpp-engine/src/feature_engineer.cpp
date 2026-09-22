#include "feature_engineer.h"

double normalize_acquisition_cost(double cost, double reference_cost) {
    return reference_cost > 0.0 ? cost / reference_cost : 0.0;
}

