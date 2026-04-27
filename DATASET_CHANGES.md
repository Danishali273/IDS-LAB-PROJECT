# Dataset Changes & Updates

## Summary
The churn analysis notebook and Flask app have been updated to work with the new telecom customer churn dataset structure.

## New Dataset Features

### Numerical Features
- **Age** - Customer age
- **Number of Dependents** - Number of dependents
- **Number of Referrals** - Customer referrals count
- **Tenure in Months** - Months as customer (previously: tenure)
- **Avg Monthly Long Distance Charges** - Average long distance charges
- **Avg Monthly GB Download** - Internet usage in GB
- **Monthly Charge** - Monthly billing amount (previously: MonthlyCharges)
- **Total Charges** - Cumulative charges
- **Total Refunds** - Total refunds received
- **Total Extra Data Charges** - Extra data charges
- **Total Long Distance Charges** - Cumulative long distance charges
- **Total Revenue** - Total revenue from customer

### Categorical Features
- **Gender** - Male/Female
- **Married** - Yes/No
- **City** - Customer city
- **Offer** - Promotional offer type (A, B, C, D, E, None)
- **Phone Service** - Yes/No
- **Multiple Lines** - Yes/No/No phone service
- **Internet Service** - Yes/No
- **Internet Type** - Cable/DSL/Fiber Optic
- **Online Security** - Yes/No/No internet service
- **Online Backup** - Yes/No/No internet service
- **Device Protection Plan** - Yes/No/No internet service
- **Premium Tech Support** - Yes/No/No internet service
- **Streaming TV** - Yes/No/No internet service
- **Streaming Movies** - Yes/No/No internet service
- **Streaming Music** - Yes/No/No internet service
- **Unlimited Data** - Yes/No
- **Contract** - Month-to-Month/One Year/Two Year
- **Paperless Billing** - Yes/No
- **Payment Method** - Credit Card/Bank Withdrawal/Mailed Check

### Target Variable
- **Customer Status** → Converted to binary **Churn** (0=Retained/Joined, 1=Churned)
- Additional columns **Churn Category** and **Churn Reason** are removed during preprocessing (available for reference only)

### Removed Columns
- Customer ID
- Zip Code
- Latitude
- Longitude
- Churn Category (kept in original CSV for reference)
- Churn Reason (kept in original CSV for reference)

## Changes to Notebook

### Data Cleaning Updates
- Fixed TotalCharges handling (now numerical columns handle missing values properly)
- Converted numeric columns from potential string types to float
- Binary encoding of churn status (0/1 format)
- Proper handling of categorical missing values

### EDA Updates
- Updated tenure analysis to use "Tenure in Months"
- Updated charge analysis to use "Monthly Charge" and "Total Revenue"
- Added Age analysis to numerical features
- Updated categorical features to match new columns
- Updated key insights based on new features

### Model Training
- All model training code remains the same
- Handles new features automatically through one-hot encoding
- Feature scaling and SMOTE rebalancing applied as before

## Changes to Flask App (app.py)

### API Endpoint Updates
- `/api/predict` now accepts new field names:
  - `Age`, `Number of Dependents`, `Number of Referrals`
  - `Tenure in Months` (instead of `tenure`)
  - `Monthly Charge` (instead of `MonthlyCharges`)
  - `Total Charges`, `Total Refunds`, `Total Revenue`
  - New options: `Internet Type`, `Device Protection Plan`, `Streaming Music`, `Unlimited Data`, `Offer`
  - Updated contract values: "One Year" / "Two Year" (instead of "One year" / "Two year")

### Prediction Output Updates
- Prediction labels changed to "Churned" / "Retained" (instead of "Churn" / "No Churn")
- Risk factors now include:
  - New customer detection (tenure < 12 months)
  - High monthly charges (> $80)
  - No referrals indicator
  - Payment method considerations
  - All internet service add-ons

## Next Steps

1. **Run the notebook** to train the model with the new dataset
2. **Test the API** with sample predictions
3. **Update the frontend** (HTML/JS) to match new field names and values
4. **Verify model performance** metrics with new dataset

## Notes
- Dataset is larger with more detailed customer information
- More numerical features enable better predictions
- City information available for geographic analysis
- Offer tracking enables retention strategy analysis
