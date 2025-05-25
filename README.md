# Diabetes Detector: Data Analysis and Visualization

## Project Overview
This project focuses on the comprehensive analysis and visualization of the Pima Indians Diabetes Dataset. The primary goal is to perform thorough data preprocessing, conduct exploratory data analysis (EDA) to uncover patterns and insights, and identify key factors associated with diabetes in patients. This serves as the foundational work for potential future predictive modeling.

## Dataset Information
The dataset originates from the National Institute of Diabetes and Digestive and Kidney Diseases and contains medical diagnostic measurements for 768 female patients of Pima Indian heritage, aged 21 years and older. The objective is to predict whether a patient has diabetes based on certain diagnostic measurements.

Features:
- **Pregnancies**: Number of times pregnant
- **Glucose**: Plasma glucose concentration after 2 hours in an oral glucose tolerance test
- **BloodPressure**: Diastolic blood pressure (mm Hg)
- **SkinThickness**: Triceps skin fold thickness (mm)
- **Insulin**: 2-Hour serum insulin (mu U/ml)
- **BMI**: Body mass index (weight in kg / (height in m)^2)
- **DiabetesPedigreeFunction**: A function that scores the likelihood of diabetes based on family history
- **Age**: Age in years
- **Outcome**: Class variable (0 = no diabetes, 1 = diabetes)

## Project Structure
```
diabetes-detector/
├── data/
│   ├── diabetes_data.csv                  # Original dataset (without headers)
│   └── diabetes_data_headers.csv          # Dataset with headers (for reference, not used in final notebook)
├── notebooks/
│   └── diabetes_analysis.ipynb            # Main Jupyter notebook for analysis
├── reports/
│   └── (This directory is intended for generated reports and visualizations if exported)
├── requirements.txt                       # File listing Python dependencies
└── README.md                              # This file
```

## Requirements
To run this project, you need Python 3.x and the libraries listed in `requirements.txt`.

### Key Libraries:
- **pandas**: For data manipulation and analysis.
- **NumPy**: For numerical operations.
- **matplotlib**: For basic plotting.
- **seaborn**: For enhanced statistical visualizations.
- **scikit-learn**: For machine learning utilities (feature selection, scaling, imputation).
- **Jupyter Notebook/JupyterLab**: For running the `.ipynb` analysis file.

## Project Setup and Execution

1.  **Clone the Repository (if applicable):**
    If you have cloned this project from a Git repository, navigate to the project directory.
    ```bash
    git clone <repository_url>
    cd diabetes-detector
    ```

2.  **Create a Virtual Environment (Recommended):**
    It's good practice to create a virtual environment to manage project dependencies.
    ```bash
    python -m venv venv
    ```
    Activate the virtual environment:
    -   Windows (PowerShell/CMD):
        ```powershell
        .\\venv\\Scripts\\Activate.ps1 
        ```
        or
        ```cmd
        .\\venv\\Scripts\\activate.bat
        ```
    -   macOS/Linux:
        ```bash
        source venv/bin/activate
        ```

3.  **Install Dependencies:**
    Install the required Python libraries using the `requirements.txt` file:
    ```bash
    pip install -r requirements.txt
    ```

4.  **Launch Jupyter Notebook/JupyterLab:**
    Once the dependencies are installed, you can launch Jupyter:
    ```bash
    jupyter notebook
    ```
    or
    ```bash
    jupyter lab
    ```
    This will open a new tab in your web browser.

5.  **Run the Analysis:**
    -   Navigate to the `notebooks/` directory in the Jupyter interface.
    -   Open the `diabetes_analysis.ipynb` notebook.
    -   You can run the cells sequentially by selecting a cell and clicking the "Run" button or by using keyboard shortcuts (e.g., `Shift + Enter` to run a cell and move to the next).

## Analysis Components
The analysis in `diabetes_analysis.ipynb` covers the following key areas as required for Review 1 (Data Preprocessing & Exploratory Data Analysis):

1.  **Data Loading and Initial Inspection:**
    -   Loading the dataset correctly.
    -   Inspecting data shape, types, and initial missing values.

2.  **Cleaning and Handling Missing Values:**
    -   Identification of implausible zero values (e.g., in 'Glucose', 'BloodPressure') as missing data.
    -   Replacement of these zeros with `NaN`.
    -   Imputation of `NaN` values using appropriate statistical measures (median).
    -   Ensuring all data types are correctly set to numeric.

3.  **Ensuring Data Integrity and Consistency:**
    -   Checking for and discussing duplicate rows.
    -   Performing basic statistical checks for consistency (e.g., `describe()`).
    -   Validating data ranges for medical sensibility.
    -   Checking for logical inconsistencies between related variables.

4.  **Feature Selection and Engineering:**
    -   Using `SelectKBest` with `f_classif` for statistical feature importance ranking.
    -   Creation of derived features such as 'BMI_Category' and 'Age_Group' to aid analysis.

5.  **Handling Outliers and Data Transformations:**
    -   Identification of outliers using the IQR method and boxplots.
    -   Application of log transformation (e.g., for 'Insulin') to handle skewed distributions.
    -   Standardization of features using `StandardScaler` for comparable scales.

6.  **Summary Statistics and Insights:**
    -   Generating descriptive statistics grouped by the 'Outcome' variable.
    -   Calculating and visualizing a correlation matrix.
    -   Deriving initial insights from the processed data.

7.  **Identifying Patterns, Trends, and Anomalies:**
    -   Utilizing various visualizations (scatter plots, pair plots, count plots, box plots, violin plots, radar charts) to explore relationships between features and the diabetes outcome.
    -   Identifying how different features vary between diabetic and non-diabetic patients.

8.  **Initial Visual Representation of Key Findings:**
    -   Presenting key findings through clear and informative visualizations, such as feature importance plots, distribution plots by outcome, and comparative charts.

## Key Findings (from EDA)
-   **Strongest Predictors**: Glucose, BMI, and Age consistently appear as significant factors associated with diabetes. Insulin and DiabetesPedigreeFunction also show importance.
-   **Glucose Levels**: Significantly higher glucose levels are observed in diabetic patients across all age groups.
-   **BMI**: Higher BMI is strongly associated with an increased risk of diabetes, with a large proportion of diabetic patients falling into 'Obese' or 'Overweight' BMI categories.
-   **Age**: The prevalence of diabetes tends to increase with age.
-   **Insulin**: Insulin levels show a complex relationship, often being higher in diabetic individuals, but also exhibiting high variability. Log transformation helps in normalizing its distribution for analysis.
-   **Correlations**: Features like Glucose, Age, BMI, and Pregnancies show positive correlations with the 'Outcome' variable.

## Technologies Used
-   **Programming Language**: Python 3.x
-   **Core Libraries**:
    -   pandas
    -   NumPy
    -   scikit-learn
-   **Visualization Libraries**:
    -   matplotlib
    -   seaborn
-   **Development Environment**: Jupyter Notebook / JupyterLab

## Future Work
While this project focuses on EDA as per Review 1, potential future steps could include:
-   Building and evaluating various machine learning models (e.g., Logistic Regression, SVM, Random Forest, Gradient Boosting) to predict diabetes.
-   Performing more advanced feature engineering and selection techniques.
-   Hyperparameter tuning for optimized model performance.
-   Developing an interactive dashboard for visualizing predictions and insights.
-   Exploring model deployment options for real-world application.
