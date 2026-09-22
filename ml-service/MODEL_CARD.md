# Land Acquisition ML Service model card

## Intended use

The service provides an illustrative delay-risk classification and expected
delay-month regression for canonical land-acquisition project payloads. It is
decision support only, not an eligibility, compensation, legal, or
displacement decision.

## Data and training

Every default training row is **synthetic** and generated reproducibly with
seed `42`; it is not government, market, or historical data. Retrain with
`python -m app.train --output-dir artifacts --samples 500`. The metadata file
records the dataset label, seed, feature list, metrics, and model version.

## Limitations

Synthetic relationships do not represent real-world causal relationships.
Unknown categories are tolerated, but missing fields are rejected. Validate
against representative, consented data and perform fairness, drift, and
domain review before any production use. Outputs are probabilistic estimates.

The inference feature set uses canonical `stateId` and `districtId` values,
project type, land area, affected families, and acquisition stage. Project
timestamps are retained as trace metadata but are excluded from model inputs
to avoid learning from update-time artifacts.

## Explainability

`POST /predict-with-explanation` returns local contributions from the fitted
logistic classifier: each transformed feature contribution is calculated from
the model coefficient multiplied by the transformed input value, then
aggregated back to the canonical feature. These are associations with the
model output, not causal claims.

## API

`GET /health`, `GET /model-info`, `POST /predict`, `POST /predict-with-explanation`,
and `POST /batch-predict`.
Prediction calls return `MODEL_UNAVAILABLE` (503) until versioned artifacts
have been trained. Invalid/incomplete payloads return structured
`INSUFFICIENT_DATA` errors.

`POST /predict-with-explanation` additionally returns versioned local
explanations from the logistic classifier. Each driver's contribution is the
classifier coefficient multiplied by the transformed input value; one-hot
category contributions are aggregated to the original feature. Contributions
are ordered by absolute magnitude and include a human label, input value, and
direction. Explanations describe model associations, not causal effects.
