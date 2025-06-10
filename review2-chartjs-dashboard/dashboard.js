// Diabetes Dashboard JavaScript - Now Using Real CSV Data
// Data Source: ../data/diabetes_data.csv (Pima Indians Diabetes Dataset)
// Global variables for data and charts
let diabetesData = [];
let filteredData = [];
let charts = {};

// Chart color schemes
const colors = {
    primary: '#74b9ff',
    secondary: '#fd79a8',
    success: '#00b894',
    warning: '#fdcb6e',
    danger: '#e17055',
    info: '#6c5ce7'
};

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Dashboard initializing...');
    console.log('Chart.js version:', Chart.version);
    
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded!');
        showErrorMessage('Chart.js library failed to load. Please check your internet connection.');
        return;
    }
      // Load data first, then initialize charts
    await loadData();
    setupEventListeners();
    
    // Initialize charts after short delay to ensure DOM is ready
    setTimeout(() => {
        console.log('Starting chart initialization...');
        initializeCharts();
        console.log('Charts initialization complete');
          // Update charts with data after another short delay
        setTimeout(() => {
            updateAllCharts();
            updateScatterPlot(); // Initialize scatter plot with default feature
            updateStorytellingInsights();
        }, 300);
    }, 200);
    
    // Handle window resize for chart responsiveness
    window.addEventListener('resize', debounce(() => {
        Object.values(charts).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    }, 250));
});

// Generate realistic diabetes data for demonstration
function generateDiabetesData(numRecords) {
    // Seeded random number generator for consistent results
    let seed = 12345; // Fixed seed for reproducible data
    function seededRandom() {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    }
    
    const data = [];
    
    for (let i = 0; i < numRecords; i++) {
        const age = Math.floor(seededRandom() * 60) + 21; // 21-80
        const pregnancies = Math.floor(seededRandom() * 17); // 0-16
        
        // Generate correlated features (more realistic)
        const baseGlucose = 80 + seededRandom() * 120; // 80-200
        const glucose = Math.max(50, baseGlucose + (age - 40) * 0.5);
          // Generate BMI with realistic distribution including underweight cases
        let baseBMI;
        const bmiType = seededRandom();
        if (bmiType < 0.05) {
            // 5% underweight (BMI 16-18.4)
            baseBMI = 16 + seededRandom() * 2.4;
        } else if (bmiType < 0.25) {
            // 20% normal weight (BMI 18.5-24.9)
            baseBMI = 18.5 + seededRandom() * 6.4;
        } else if (bmiType < 0.50) {
            // 25% overweight (BMI 25-29.9)
            baseBMI = 25 + seededRandom() * 4.9;
        } else {
            // 50% obese (BMI 30+)
            baseBMI = 30 + seededRandom() * 15;
        }
        const bmi = Math.max(15, baseBMI + (age - 40) * 0.05);
        
        const bloodPressure = Math.max(40, 60 + seededRandom() * 60 + (age - 30) * 0.3);
        const skinThickness = Math.max(10, 15 + seededRandom() * 40);
        const insulin = Math.max(15, 50 + seededRandom() * 400);
        const dpf = 0.1 + seededRandom() * 2.0; // Diabetes Pedigree Function
        
        // Calculate diabetes outcome based on risk factors
        let riskScore = 0;
        if (glucose > 125) riskScore += 3;
        else if (glucose > 100) riskScore += 1;
        
        if (bmi > 30) riskScore += 2;
        else if (bmi > 25) riskScore += 1;
        
        if (age > 50) riskScore += 2;
        else if (age > 35) riskScore += 1;
        
        if (pregnancies > 5) riskScore += 1;
        if (dpf > 1.0) riskScore += 1;
        
        // Add some randomness
        riskScore += seededRandom() * 2 - 1;
        
        const outcome = riskScore > 3.5 ? 1 : 0;
        
        data.push({
            id: i + 1,
            pregnancies,
            glucose: Math.round(glucose),
            bloodPressure: Math.round(bloodPressure),
            skinThickness: Math.round(skinThickness),
            insulin: Math.round(insulin),
            bmi: Math.round(bmi * 10) / 10,
            diabetesPedigreeFunction: Math.round(dpf * 1000) / 1000,
            age,
            outcome,
            // Derived fields
            ageGroup: getAgeGroup(age),
            bmiCategory: getBMICategory(bmi),
            glucoseCategory: getGlucoseCategory(glucose),
            riskLevel: getRiskLevel(riskScore)
        });
    }
    
    return data;
}

// Helper functions for categorization
function getAgeGroup(age) {
    if (age <= 30) return 'young';
    if (age <= 50) return 'middle';
    return 'older';
}

function getBMICategory(bmi) {
    if (bmi < 18.5) return 'underweight';
    if (bmi < 25) return 'normal';
    if (bmi < 30) return 'overweight';
    return 'obese';
}

function getGlucoseCategory(glucose) {
    if (glucose < 100) return 'normal';
    if (glucose < 126) return 'prediabetic';
    return 'diabetic';
}

function getRiskLevel(riskScore) {
    if (riskScore <= 2) return 'low';
    if (riskScore <= 4) return 'medium';
    return 'high';
}

// Load and process diabetes data from CSV files
async function loadData() {
    try {
        console.log('Loading diabetes data from CSV files...');
          // Load headers and data from CSV files
        const [headersResponse, dataResponse] = await Promise.all([
            fetch('./diabetes_data_headers.csv'),
            fetch('./diabetes_data.csv')
        ]);
        
        if (!headersResponse.ok || !dataResponse.ok) {
            throw new Error(`Failed to fetch CSV files: Headers ${headersResponse.status}, Data ${dataResponse.status}`);
        }
        
        const headersText = await headersResponse.text();
        const dataText = await dataResponse.text();
        
        // Parse headers
        const headers = headersText.trim().split(',');
        console.log('CSV Headers:', headers);
        
        // Parse data rows
        const dataRows = dataText.trim().split('\n').filter(row => row.trim() !== '');
        console.log('Total data rows:', dataRows.length);
        
        // Convert CSV data to objects
        diabetesData = dataRows.map((row, index) => {
            const values = row.split(',').map(val => val.trim());
            
            // Validate row has correct number of columns
            if (values.length !== 9) {
                console.warn(`Row ${index + 1} has ${values.length} columns, expected 9:`, values);
            }
            
            const record = {
                id: index + 1,
                pregnancies: parseInt(values[0]) || 0,
                glucose: parseInt(values[1]) || 0,
                bloodPressure: parseInt(values[2]) || 0,
                skinThickness: parseInt(values[3]) || 0,
                insulin: parseInt(values[4]) || 0,
                bmi: parseFloat(values[5]) || 0,
                diabetesPedigreeFunction: parseFloat(values[6]) || 0,
                age: parseInt(values[7]) || 0,
                outcome: parseInt(values[8]) || 0,
                // Derived fields
                ageGroup: getAgeGroup(parseInt(values[7]) || 0),
                bmiCategory: getBMICategory(parseFloat(values[5]) || 0),
                glucoseCategory: getGlucoseCategory(parseInt(values[1]) || 0),
                riskLevel: getRiskLevel(calculateRiskScore(values))
            };
            
            return record;
        });
          filteredData = [...diabetesData];
        console.log('✅ CSV Data loaded successfully:', diabetesData.length, 'records');
        console.log('Sample record:', diabetesData[0]);
        
        // Log data summary
        const diabeticCount = diabetesData.filter(d => d.outcome === 1).length;
        const avgAge = diabetesData.reduce((sum, d) => sum + d.age, 0) / diabetesData.length;
        const avgGlucose = diabetesData.reduce((sum, d) => sum + d.glucose, 0) / diabetesData.length;
        const avgBMI = diabetesData.reduce((sum, d) => sum + d.bmi, 0) / diabetesData.length;
        
        console.log(`📊 Dataset summary:`);
        console.log(`   - Total: ${diabetesData.length} patients`);
        console.log(`   - Diabetic: ${diabeticCount} (${(diabeticCount/diabetesData.length*100).toFixed(1)}%)`);
        console.log(`   - Non-diabetic: ${diabetesData.length - diabeticCount} (${((diabetesData.length - diabeticCount)/diabetesData.length*100).toFixed(1)}%)`);
        console.log(`   - Avg Age: ${avgAge.toFixed(1)} years`);
        console.log(`   - Avg Glucose: ${avgGlucose.toFixed(1)} mg/dL`);
        console.log(`   - Avg BMI: ${avgBMI.toFixed(1)}`);
        console.log(`   - Age range: ${Math.min(...diabetesData.map(d => d.age))} - ${Math.max(...diabetesData.map(d => d.age))} years`);
        console.log(`   - Glucose range: ${Math.min(...diabetesData.map(d => d.glucose))} - ${Math.max(...diabetesData.map(d => d.glucose))} mg/dL`);
        console.log(`   - BMI range: ${Math.min(...diabetesData.map(d => d.bmi))} - ${Math.max(...diabetesData.map(d => d.bmi))}`);
        
        updateSummaryStats();
    } catch (error) {
        console.error('❌ Error loading CSV data:', error);
        console.log('🔄 Falling back to generated data...');
        
        // Fallback to generated data if CSV loading fails
        diabetesData = generateDiabetesData(768);
        filteredData = [...diabetesData];
        console.log('⚠️ Fallback data loaded:', diabetesData.length, 'records');
        updateSummaryStats();
        
        // Show user-friendly message
        showErrorMessage('Note: Using simulated data as CSV files could not be loaded. Check browser console for details.');
    }
}

// Calculate risk score for CSV data
function calculateRiskScore(values) {
    const glucose = parseInt(values[1]) || 0;
    const bmi = parseFloat(values[5]) || 0;
    const age = parseInt(values[7]) || 0;
    const pregnancies = parseInt(values[0]) || 0;
    const dpf = parseFloat(values[6]) || 0;
    
    let riskScore = 0;
    if (glucose > 125) riskScore += 3;
    else if (glucose > 100) riskScore += 1;
    
    if (bmi > 30) riskScore += 2;
    else if (bmi > 25) riskScore += 1;
    
    if (age > 50) riskScore += 2;
    else if (age > 35) riskScore += 1;
    
    if (pregnancies > 5) riskScore += 1;
    if (dpf > 1.0) riskScore += 1;
    
    return riskScore;
}

// Update summary statistics
function updateSummaryStats() {
    const totalPatients = filteredData.length;
    const diabetesCases = filteredData.filter(d => d.outcome === 1).length;
    const prevalenceRate = ((diabetesCases / totalPatients) * 100).toFixed(1);
    const avgAge = (filteredData.reduce((sum, d) => sum + d.age, 0) / totalPatients).toFixed(1);
    
    document.getElementById('totalPatients').textContent = totalPatients;
    document.getElementById('diabetesCases').textContent = diabetesCases;
    document.getElementById('prevalenceRate').textContent = prevalenceRate + '%';
    document.getElementById('avgAge').textContent = avgAge + ' yrs';
}

// Setup event listeners
function setupEventListeners() {
    // Filter controls
    const ageFilter = document.getElementById('ageFilter');
    const bmiFilter = document.getElementById('bmiFilter');
    const featureSelect = document.getElementById('featureSelect');
    
    if (ageFilter) ageFilter.addEventListener('change', updateCharts);
    if (bmiFilter) bmiFilter.addEventListener('change', updateCharts);
    if (featureSelect) featureSelect.addEventListener('change', updateScatterPlot);
    
    // Risk calculator inputs
    const glucoseInput = document.getElementById('glucoseInput');
    const bmiInput = document.getElementById('bmiInput');
    const ageInput = document.getElementById('ageInput');
    
    if (glucoseInput) glucoseInput.addEventListener('input', updateRiskCalculator);
    if (bmiInput) bmiInput.addEventListener('input', updateRiskCalculator);
    if (ageInput) ageInput.addEventListener('input', updateRiskCalculator);
    
    // Initialize risk calculator with default values
    updateRiskCalculator();
}

// Initialize all charts
function initializeCharts() {
    console.log('Initializing charts...');
    console.log('Available canvas elements:');
      // Check all canvas elements
    const canvasIds = [
        'diabetesDistributionChart',
        'correlationMatrix', 
        'riskScatterPlot',
        'ageAnalysisChart',
        'clinicalThresholdsChart',
        'featureImportanceChart',
        'riskGaugeChart',
        'violinPlotChart'
    ];
    
    canvasIds.forEach(id => {
        const canvas = document.getElementById(id);
        console.log(`${id}: ${canvas ? 'Found' : 'MISSING'}`);
        if (canvas) {
            console.log(`  - Width: ${canvas.width}, Height: ${canvas.height}`);
            console.log(`  - Parent: ${canvas.parentElement.className}`);
        }
    });
    
    initializeDiabetesDistributionChart();
    initializeCorrelationMatrix();
    initializeRiskScatterPlot();
    initializeAgeAnalysisChart();
    initializeClinicalThresholdsChart();    initializeFeatureImportanceChart();
    initializeRiskGaugeChart();
    initializeViolinPlotChart();
    
    console.log('Charts object:', Object.keys(charts));
}

// Chart 1: Diabetes Distribution Chart
function initializeDiabetesDistributionChart() {
    console.log('Initializing diabetes distribution chart...');
    const canvas = document.getElementById('diabetesDistributionChart');
    if (!canvas) {
        console.error('Canvas element diabetesDistributionChart not found');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    charts.diabetesDistributionChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['No Diabetes', 'Diabetes'],
            datasets: [{
                label: 'Diabetes Distribution',
                data: [500, 268], // Sample data - will be updated
                backgroundColor: [colors.success, colors.danger],
                borderColor: '#ffffff',
                borderWidth: 3,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed * 100) / total).toFixed(1);
                            return `${context.label}: ${context.parsed} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
    console.log('Diabetes distribution chart created successfully');
}

// Chart 2: Correlation Matrix
function initializeCorrelationMatrix() {
    console.log('Initializing correlation matrix...');
    const canvas = document.getElementById('correlationMatrix');
    if (!canvas) {
        console.error('Canvas element correlationMatrix not found');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Create a simple correlation visualization using horizontal bar chart
    const features = ['Glucose', 'BMI', 'Age', 'Pregnancies', 'Blood Pressure', 'Insulin'];
    const correlations = [0.47, 0.29, 0.24, 0.22, 0.15, 0.13]; // Approximate correlations with diabetes
    
    charts.correlationMatrix = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: features,
            datasets: [{
                label: 'Correlation with Diabetes',
                data: correlations,
                backgroundColor: features.map(f => f === 'Glucose' ? colors.danger : colors.primary),
                borderColor: '#ffffff',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Correlation Coefficient',
                        font: { weight: 'bold' }
                    },
                    min: 0,
                    max: 0.5
                },
                y: {
                    title: {
                        display: true,
                        text: 'Risk Factors',
                        font: { weight: 'bold' }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.parsed.x.toFixed(3)} correlation`;
                        }
                    }
                }
            }
        }
    });
    console.log('Correlation matrix chart created successfully');
}

// Chart 3: Risk Scatter Plot
function initializeRiskScatterPlot() {
    console.log('Initializing risk scatter plot...');
    const canvas = document.getElementById('riskScatterPlot');
    if (!canvas) {
        console.error('Canvas element riskScatterPlot not found');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Clear any existing background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Ensure canvas has transparent background
    canvas.style.background = 'transparent';
    
    charts.riskScatterPlot = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'No Diabetes',
                data: [],
                backgroundColor: colors.success,
                borderColor: colors.success,
                pointRadius: 5,
                pointHoverRadius: 8
            }, {
                label: 'Diabetes',
                data: [],
                backgroundColor: colors.danger,
                borderColor: colors.danger,
                pointRadius: 5,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            backgroundColor: 'transparent',
            layout: {
                padding: 0
            },            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Glucose Level (mg/dL)',
                        font: { weight: 'bold' }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'BMI',
                        font: { weight: 'bold' }
                    }
                }
            },plugins: {
                legend: {
                    position: 'top'
                },
                tooltip: {
                    backgroundColor: 'rgba(44, 62, 80, 0.9)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    callbacks: {
                        label: function(context) {
                            const featureSelect = document.getElementById('featureSelect')?.value || 'Glucose';
                            
                            if (featureSelect === 'Glucose') {
                                return `${context.dataset.label} - Glucose: ${context.parsed.x}mg/dL, BMI: ${context.parsed.y}`;
                            } else if (featureSelect === 'BMI') {
                                return `${context.dataset.label} - BMI: ${context.parsed.x}, Age: ${context.parsed.y} years`;
                            } else if (featureSelect === 'BloodPressure') {
                                return `${context.dataset.label} - BP: ${context.parsed.x}mmHg, Glucose: ${context.parsed.y}mg/dL`;
                            } else if (featureSelect === 'Insulin') {
                                return `${context.dataset.label} - Insulin: ${context.parsed.x}μU/mL, Glucose: ${context.parsed.y}mg/dL`;
                            } else if (featureSelect === 'Age') {
                                return `${context.dataset.label} - Age: ${context.parsed.x} years, BMI: ${context.parsed.y}`;
                            }
                            
                            return `${context.dataset.label} - X: ${context.parsed.x}, Y: ${context.parsed.y}`;
                        }
                    }
                }
            },
            elements: {
                point: {
                    backgroundColor: 'transparent'
                }
            }
        }
    });
    console.log('Risk scatter plot created successfully');
}

// Chart 4: Age Analysis Chart
function initializeAgeAnalysisChart() {
    console.log('Initializing age analysis chart...');
    const canvas = document.getElementById('ageAnalysisChart');
    if (!canvas) {
        console.error('Canvas element ageAnalysisChart not found');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    charts.ageAnalysisChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['21-30', '31-40', '41-50', '51-60', '61+'],
            datasets: [{
                label: 'Diabetes Cases',
                data: [0, 0, 0, 0, 0], // Will be updated
                backgroundColor: colors.danger,
                borderColor: colors.danger,
                borderWidth: 2,
                borderRadius: 8
            }, {
                label: 'Total Patients',
                data: [0, 0, 0, 0, 0], // Will be updated
                backgroundColor: colors.primary,
                borderColor: colors.primary,
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Age Groups',
                        font: { weight: 'bold' }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Number of Patients',
                        font: { weight: 'bold' }
                    },
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                }
            }
        }
    });
    console.log('Age analysis chart created successfully');
}

// Chart 5: Clinical Thresholds Chart
function initializeClinicalThresholdsChart() {
    console.log('Initializing clinical thresholds chart...');
    const canvas = document.getElementById('clinicalThresholdsChart');
    if (!canvas) {
        console.error('Canvas element clinicalThresholdsChart not found');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    charts.clinicalThresholdsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Normal Glucose', 'Prediabetic', 'Diabetic', 'Normal BMI', 'Overweight', 'Obese'],
            datasets: [{
                label: 'Patient Count',
                data: [0, 0, 0, 0, 0, 0], // Will be updated
                backgroundColor: [
                    colors.success, colors.warning, colors.danger,
                    colors.success, colors.warning, colors.danger
                ],
                borderColor: '#ffffff',
                borderWidth: 2,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Number of Patients',
                        font: { weight: 'bold' }
                    },
                    beginAtZero: true
                },
                y: {
                    title: {
                        display: true,
                        text: 'Clinical Categories',
                        font: { weight: 'bold' }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
    console.log('Clinical thresholds chart created successfully');
}

// Chart 6: Feature Importance Chart
function initializeFeatureImportanceChart() {
    console.log('Initializing feature importance chart...');
    const canvas = document.getElementById('featureImportanceChart');
    if (!canvas) {
        console.error('Canvas element featureImportanceChart not found');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    const features = ['Glucose', 'BMI', 'Age', 'Blood Pressure', 'Insulin', 'Pregnancies'];
    const importance = [0.95, 0.68, 0.54, 0.42, 0.38, 0.35]; // Sample importance values
    
    charts.featureImportanceChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: features,
            datasets: [{
                label: 'Feature Importance',
                data: importance,
                backgroundColor: 'rgba(116, 185, 255, 0.2)',
                borderColor: colors.primary,
                borderWidth: 3,
                pointBackgroundColor: colors.primary,
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 1,
                    ticks: {
                        stepSize: 0.2
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
    console.log('Feature importance chart created successfully');
}

// Chart 7: Risk Gauge Chart
function initializeRiskGaugeChart() {
    console.log('Initializing risk gauge chart...');
    const canvas = document.getElementById('riskGaugeChart');
    if (!canvas) {
        console.error('Canvas element riskGaugeChart not found');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    charts.riskGaugeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [25, 75], // 25% risk, 75% safe
                backgroundColor: [colors.warning, '#f0f0f0'],
                borderWidth: 0,
                circumference: 180,
                rotation: 270,
                cutout: '80%'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                }
            }
        }
    });    console.log('Risk gauge chart created successfully');
}

// Chart 8: Violin Plot Chart (Custom Implementation)
function initializeViolinPlotChart() {
    console.log('Initializing violin plot chart...');
    const canvas = document.getElementById('violinPlotChart');
    if (!canvas) {
        console.error('Canvas element violinPlotChart not found');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Generate distribution data for violin plot
    const bins = [];
    const diabeticDensity = [];
    const nonDiabeticDensity = [];
    
    // Create 20 bins for glucose distribution
    for (let i = 0; i < 20; i++) {
        const binStart = 50 + (i * 7.5); // 50-200 range, 7.5 unit bins
        const binEnd = binStart + 7.5;
        bins.push(`${binStart.toFixed(0)}-${binEnd.toFixed(0)}`);
        
        // Count patients in each bin
        const diabeticInBin = diabetesData.filter(d => 
            d.outcome === 1 && d.glucose >= binStart && d.glucose < binEnd
        ).length;
        
        const nonDiabeticInBin = diabetesData.filter(d => 
            d.outcome === 0 && d.glucose >= binStart && d.glucose < binEnd
        ).length;
        
        // Normalize to create density-like distribution
        const totalDiabetic = diabetesData.filter(d => d.outcome === 1).length;
        const totalNonDiabetic = diabetesData.filter(d => d.outcome === 0).length;
        
        diabeticDensity.push((diabeticInBin / totalDiabetic) * 100);
        nonDiabeticDensity.push((nonDiabeticInBin / totalNonDiabetic) * 100);
    }
    
    charts.violinPlotChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: bins,
            datasets: [{
                label: 'Diabetic Distribution',
                data: diabeticDensity,
                backgroundColor: 'rgba(225, 112, 85, 0.3)',
                borderColor: colors.danger,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6
            }, {
                label: 'Non-Diabetic Distribution',
                data: nonDiabeticDensity,
                backgroundColor: 'rgba(0, 184, 148, 0.3)',
                borderColor: colors.success,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Glucose Level Ranges (mg/dL)',
                        font: { weight: 'bold' }
                    },
                    ticks: {
                        maxRotation: 45,
                        font: { size: 10 }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Distribution Density (%)',
                        font: { weight: 'bold' }
                    },
                    beginAtZero: true
                }
            },            plugins: {
                legend: {
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            return `Glucose Range: ${context[0].label} mg/dL`;
                        },
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}% of patients`;
                        }
                    }
                }
            }
        }
    });
    console.log('Violin plot chart created successfully');
}

// Update all charts with current filtered data
function updateAllCharts() {
    console.log('Updating all charts with data...');
    updateDiabetesDistributionChart();
    updateCorrelationMatrix();
    updateRiskScatterPlot();
    updateAgeAnalysisChart();
    updateClinicalThresholdsChart();
    updateFeatureImportanceChart();
    updateViolinPlotChart();
    console.log('All charts updated');
}

// Update correlation matrix chart with real data and insights
function updateCorrelationMatrix() {
    if (!charts.correlationMatrix) return;
    
    // Calculate real correlations with the current filtered data
    const features = ['glucose', 'bmi', 'age', 'pregnancies', 'bloodPressure', 'insulin'];
    const featureLabels = ['Glucose', 'BMI', 'Age', 'Pregnancies', 'Blood Pressure', 'Insulin'];
    
    const correlations = features.map(feature => {
        const correlation = calculateCorrelation(
            filteredData.map(d => d[feature]),
            filteredData.map(d => d.outcome)
        );
        return Math.abs(correlation); // Use absolute value for display
    });
    
    // Update chart data
    charts.correlationMatrix.data.datasets[0].data = correlations;
    charts.correlationMatrix.data.labels = featureLabels;
    
    // Update chart colors based on correlation strength
    charts.correlationMatrix.data.datasets[0].backgroundColor = correlations.map(corr => {
        if (corr > 0.4) return colors.danger; // Strong correlation
        if (corr > 0.2) return colors.warning; // Moderate correlation
        return colors.primary; // Weak correlation
    });
    
    charts.correlationMatrix.update('active');
    
    // Generate insights based on correlations
    const correlationPairs = features.map((feature, index) => ({
        feature: featureLabels[index],
        correlation: correlations[index]
    })).sort((a, b) => b.correlation - a.correlation);
    
    const insights = [
        `${correlationPairs[0].feature} shows strongest correlation (${correlationPairs[0].correlation.toFixed(3)})`,
        `${correlationPairs[1].feature} and ${correlationPairs[2].feature} are also significant predictors`,
        `${correlationPairs.filter(p => p.correlation > 0.2).length} features show moderate to strong correlation`,
        `Clinical focus should prioritize ${correlationPairs[0].feature.toLowerCase()} monitoring`
    ];
    
    updateInsightsList('correlationInsightsList', insights);
}

// Update diabetes distribution chart
function updateDiabetesDistributionChart() {
    if (!charts.diabetesDistributionChart) return;
    
    const diabeticCount = filteredData.filter(d => d.outcome === 1).length;
    const nonDiabeticCount = filteredData.length - diabeticCount;
    
    charts.diabetesDistributionChart.data.datasets[0].data = [nonDiabeticCount, diabeticCount];
    charts.diabetesDistributionChart.update('active');
    
    // Update insights
    const prevalence = ((diabeticCount / filteredData.length) * 100).toFixed(1);
    const insights = [
        `${prevalence}% diabetes prevalence in current selection`,
        `${diabeticCount} out of ${filteredData.length} patients have diabetes`,
        `Risk varies significantly across different patient groups`
    ];
    
    updateInsightsList('distributionInsightsList', insights);
}

// Update risk scatter plot (used for general chart updates, not feature selection)
function updateRiskScatterPlot() {
    if (!charts.riskScatterPlot) return;
    
    // Only update data, preserve current axis configuration from feature selection
    const nonDiabetic = filteredData.filter(d => d.outcome === 0);
    const diabetic = filteredData.filter(d => d.outcome === 1);
    
    // Get current feature selection to maintain consistency
    const featureSelect = document.getElementById('featureSelect')?.value || 'Glucose';
    const featureMap = {
        'Glucose': 'glucose',
        'BMI': 'bmi', 
        'BloodPressure': 'bloodPressure',
        'Insulin': 'insulin',
        'Age': 'age'
    };
    
    const selectedFeature = featureMap[featureSelect] || 'glucose';
    
    // Update data and axis ranges based on current feature selection
    if (selectedFeature === 'glucose') {
        charts.riskScatterPlot.data.datasets[0].data = nonDiabetic.map(d => ({
            x: d.glucose, y: d.bmi
        })).slice(0, 100);
        charts.riskScatterPlot.data.datasets[1].data = diabetic.map(d => ({
            x: d.glucose, y: d.bmi
        })).slice(0, 100);
        
        // Update axis ranges
        const xRange = calculateAxisRange(filteredData, 'glucose', 5);
        const yRange = calculateAxisRange(filteredData, 'bmi', 2);
        charts.riskScatterPlot.options.scales.x.min = xRange.min;
        charts.riskScatterPlot.options.scales.x.max = xRange.max;
        charts.riskScatterPlot.options.scales.y.min = yRange.min;
        charts.riskScatterPlot.options.scales.y.max = yRange.max;
        
    } else if (selectedFeature === 'bmi') {
        charts.riskScatterPlot.data.datasets[0].data = nonDiabetic.map(d => ({
            x: d.bmi, y: d.age
        })).slice(0, 100);
        charts.riskScatterPlot.data.datasets[1].data = diabetic.map(d => ({
            x: d.bmi, y: d.age
        })).slice(0, 100);
        
        // Update axis ranges
        const xRange = calculateAxisRange(filteredData, 'bmi', 2);
        const yRange = calculateAxisRange(filteredData, 'age', 3);
        charts.riskScatterPlot.options.scales.x.min = xRange.min;
        charts.riskScatterPlot.options.scales.x.max = xRange.max;
        charts.riskScatterPlot.options.scales.y.min = yRange.min;
        charts.riskScatterPlot.options.scales.y.max = yRange.max;
        
    } else if (selectedFeature === 'bloodPressure') {
        charts.riskScatterPlot.data.datasets[0].data = nonDiabetic.map(d => ({
            x: d.bloodPressure, y: d.glucose
        })).slice(0, 100);
        charts.riskScatterPlot.data.datasets[1].data = diabetic.map(d => ({
            x: d.bloodPressure, y: d.glucose
        })).slice(0, 100);
        
        // Update axis ranges
        const xRange = calculateAxisRange(filteredData, 'bloodPressure', 5);
        const yRange = calculateAxisRange(filteredData, 'glucose', 5);
        charts.riskScatterPlot.options.scales.x.min = xRange.min;
        charts.riskScatterPlot.options.scales.x.max = xRange.max;
        charts.riskScatterPlot.options.scales.y.min = yRange.min;
        charts.riskScatterPlot.options.scales.y.max = yRange.max;
        
    } else if (selectedFeature === 'insulin') {
        charts.riskScatterPlot.data.datasets[0].data = nonDiabetic.map(d => ({
            x: d.insulin, y: d.glucose
        })).slice(0, 100);
        charts.riskScatterPlot.data.datasets[1].data = diabetic.map(d => ({
            x: d.insulin, y: d.glucose
        })).slice(0, 100);
        
        // Update axis ranges
        const xRange = calculateAxisRange(filteredData, 'insulin', 10);
        const yRange = calculateAxisRange(filteredData, 'glucose', 5);
        charts.riskScatterPlot.options.scales.x.min = xRange.min;
        charts.riskScatterPlot.options.scales.x.max = xRange.max;
        charts.riskScatterPlot.options.scales.y.min = yRange.min;
        charts.riskScatterPlot.options.scales.y.max = yRange.max;
        
    } else if (selectedFeature === 'age') {
        charts.riskScatterPlot.data.datasets[0].data = nonDiabetic.map(d => ({
            x: d.age, y: d.bmi
        })).slice(0, 100);
        charts.riskScatterPlot.data.datasets[1].data = diabetic.map(d => ({
            x: d.age, y: d.bmi
        })).slice(0, 100);
        
        // Update axis ranges
        const xRange = calculateAxisRange(filteredData, 'age', 3);
        const yRange = calculateAxisRange(filteredData, 'bmi', 2);
        charts.riskScatterPlot.options.scales.x.min = xRange.min;
        charts.riskScatterPlot.options.scales.x.max = xRange.max;
        charts.riskScatterPlot.options.scales.y.min = yRange.min;
        charts.riskScatterPlot.options.scales.y.max = yRange.max;
    }
    
    charts.riskScatterPlot.update('active');
}

// Update age analysis chart
function updateAgeAnalysisChart() {
    if (!charts.ageAnalysisChart) return;
    
    const ageGroups = ['21-30', '31-40', '41-50', '51-60', '61+'];
    const groupCounts = [0, 0, 0, 0, 0];
    const diabeticCounts = [0, 0, 0, 0, 0];
    
    filteredData.forEach(patient => {
        let groupIndex;
        if (patient.age <= 30) groupIndex = 0;
        else if (patient.age <= 40) groupIndex = 1;
        else if (patient.age <= 50) groupIndex = 2;
        else if (patient.age <= 60) groupIndex = 3;
        else groupIndex = 4;
        
        groupCounts[groupIndex]++;
        if (patient.outcome === 1) diabeticCounts[groupIndex]++;
    });
    
    charts.ageAnalysisChart.data.datasets[0].data = diabeticCounts;
    charts.ageAnalysisChart.data.datasets[1].data = groupCounts;
    charts.ageAnalysisChart.update('active');
    
    // Update trend indicator
    const ageTrendElement = document.getElementById('ageTrendText');
    if (ageTrendElement) {
        // Calculate diabetes prevalence rates for each age group
        const prevalenceRates = groupCounts.map((total, index) => 
            total > 0 ? (diabeticCounts[index] / total * 100) : 0
        );
        
        // Determine trend based on prevalence progression
        let trendText = 'Stable';
        let trendClass = '';
        
        if (prevalenceRates.length >= 2) {
            const firstRate = prevalenceRates[0];
            const lastRate = prevalenceRates[prevalenceRates.length - 1];
            const middleRate = prevalenceRates[Math.floor(prevalenceRates.length / 2)];
            
            if (lastRate > firstRate * 1.5) {
                trendText = 'Increasing with Age ↗️';
                trendClass = 'trend-increasing';
            } else if (lastRate < firstRate * 0.7) {
                trendText = 'Decreasing with Age ↘️';
                trendClass = 'trend-decreasing';
            } else if (middleRate > firstRate * 1.2 || lastRate > firstRate * 1.2) {
                trendText = 'Generally Increasing ↗️';
                trendClass = 'trend-increasing';
            } else {
                trendText = 'Relatively Stable ➡️';
                trendClass = 'trend-stable';
            }
        }
        
        ageTrendElement.textContent = trendText;
        ageTrendElement.className = trendClass;
    }
}

// Update clinical thresholds chart
function updateClinicalThresholdsChart() {
    if (!charts.clinicalThresholdsChart) return;
    
    const counts = [
        filteredData.filter(d => d.glucose < 100).length,
        filteredData.filter(d => d.glucose >= 100 && d.glucose <= 125).length,
        filteredData.filter(d => d.glucose > 125).length,
        filteredData.filter(d => d.bmi < 25).length,
        filteredData.filter(d => d.bmi >= 25 && d.bmi < 30).length,
        filteredData.filter(d => d.bmi >= 30).length
    ];
    
    charts.clinicalThresholdsChart.data.datasets[0].data = counts;
    charts.clinicalThresholdsChart.update('active');
}

// Update feature importance chart
function updateFeatureImportanceChart() {
    if (!charts.featureImportanceChart) return;
    
    // Calculate real correlations
    const features = ['glucose', 'bmi', 'age', 'bloodPressure', 'insulin', 'pregnancies'];
    const importance = features.map(feature => {
        const correlation = Math.abs(calculateCorrelation(
            filteredData.map(d => d[feature]),
            filteredData.map(d => d.outcome)
        ));
        return correlation;
    });
    
    // Normalize to 0-1 scale
    const maxImportance = Math.max(...importance);
    const normalizedImportance = importance.map(imp => maxImportance > 0 ? imp / maxImportance : 0);
      charts.featureImportanceChart.data.datasets[0].data = normalizedImportance;
    charts.featureImportanceChart.update('active');
}

// Update violin plot chart
function updateViolinPlotChart() {
    if (!charts.violinPlotChart) return;
    
    // Recalculate distribution based on filtered data
    const bins = [];
    const diabeticDensity = [];
    const nonDiabeticDensity = [];
    
    // Create 20 bins for glucose distribution
    for (let i = 0; i < 20; i++) {
        const binStart = 50 + (i * 7.5);
        const binEnd = binStart + 7.5;
        
        // Count patients in each bin from filtered data
        const diabeticInBin = filteredData.filter(d => 
            d.outcome === 1 && d.glucose >= binStart && d.glucose < binEnd
        ).length;
        
        const nonDiabeticInBin = filteredData.filter(d => 
            d.outcome === 0 && d.glucose >= binStart && d.glucose < binEnd
        ).length;
        
        // Normalize to create density-like distribution
        const totalDiabetic = filteredData.filter(d => d.outcome === 1).length;
        const totalNonDiabetic = filteredData.filter(d => d.outcome === 0).length;
        
        diabeticDensity.push(totalDiabetic > 0 ? (diabeticInBin / totalDiabetic) * 100 : 0);
        nonDiabeticDensity.push(totalNonDiabetic > 0 ? (nonDiabeticInBin / totalNonDiabetic) * 100 : 0);
    }
    
    charts.violinPlotChart.data.datasets[0].data = diabeticDensity;
    charts.violinPlotChart.data.datasets[1].data = nonDiabeticDensity;
    charts.violinPlotChart.update('active');
    
    // Update violin plot insights
    const diabeticMean = filteredData.filter(d => d.outcome === 1)
        .reduce((sum, d) => sum + d.glucose, 0) / filteredData.filter(d => d.outcome === 1).length;
    
    const nonDiabeticMean = filteredData.filter(d => d.outcome === 0)
        .reduce((sum, d) => sum + d.glucose, 0) / filteredData.filter(d => d.outcome === 0).length;
    
    const insights = [
        `Diabetic patients show higher glucose distribution (mean: ${diabeticMean.toFixed(1)} mg/dL)`,
        `Non-diabetic patients cluster at lower glucose levels (mean: ${nonDiabeticMean.toFixed(1)} mg/dL)`,
        `Clear separation visible around 125 mg/dL diagnostic threshold`,
        `Distribution shapes reveal overlapping but distinct populations`
    ];
    
    updateInsightsList('violinInsightsList', insights);
}

// Filter functions
function updateCharts() {
    console.log('updateCharts() called');
    applyFilters();
    updateSummaryStats();
    updateAllCharts();
    updateStorytellingInsights();
}

function updateScatterPlot() {
    console.log('updateScatterPlot() called');
    
    const featureSelect = document.getElementById('featureSelect')?.value || 'Glucose';
    console.log('Selected feature:', featureSelect);
    
    if (!charts.riskScatterPlot) return;
    
    const nonDiabetic = filteredData.filter(d => d.outcome === 0);
    const diabetic = filteredData.filter(d => d.outcome === 1);
    
    // Map feature names to data properties
    const featureMap = {
        'Glucose': 'glucose',
        'BMI': 'bmi', 
        'BloodPressure': 'bloodPressure',
        'Insulin': 'insulin',
        'Age': 'age'
    };
    
    const selectedFeature = featureMap[featureSelect] || 'glucose';
      // Update chart data based on selected feature
    if (selectedFeature === 'glucose') {
        // Default: Glucose vs BMI
        const xData = filteredData.map(d => d.glucose);
        const yData = filteredData.map(d => d.bmi);
        
        charts.riskScatterPlot.data.datasets[0].data = nonDiabetic.map(d => ({
            x: d.glucose,
            y: d.bmi
        })).slice(0, 100);
        
        charts.riskScatterPlot.data.datasets[1].data = diabetic.map(d => ({
            x: d.glucose,
            y: d.bmi
        })).slice(0, 100);
        
        // Calculate dynamic ranges
        const xRange = calculateAxisRange(filteredData, 'glucose', 5);
        const yRange = calculateAxisRange(filteredData, 'bmi', 2);
        
        // Update axes labels and ranges
        charts.riskScatterPlot.options.scales.x.title.text = 'Glucose Level (mg/dL)';
        charts.riskScatterPlot.options.scales.y.title.text = 'BMI';
        charts.riskScatterPlot.options.scales.x.min = xRange.min;
        charts.riskScatterPlot.options.scales.x.max = xRange.max;
        charts.riskScatterPlot.options.scales.y.min = yRange.min;
        charts.riskScatterPlot.options.scales.y.max = yRange.max;
        
    } else if (selectedFeature === 'bmi') {
        // BMI vs Age
        charts.riskScatterPlot.data.datasets[0].data = nonDiabetic.map(d => ({
            x: d.bmi,
            y: d.age
        })).slice(0, 100);
        
        charts.riskScatterPlot.data.datasets[1].data = diabetic.map(d => ({
            x: d.bmi,
            y: d.age
        })).slice(0, 100);
        
        // Calculate dynamic ranges
        const xRange = calculateAxisRange(filteredData, 'bmi', 2);
        const yRange = calculateAxisRange(filteredData, 'age', 3);
        
        charts.riskScatterPlot.options.scales.x.title.text = 'BMI';
        charts.riskScatterPlot.options.scales.y.title.text = 'Age (years)';
        charts.riskScatterPlot.options.scales.x.min = xRange.min;
        charts.riskScatterPlot.options.scales.x.max = xRange.max;
        charts.riskScatterPlot.options.scales.y.min = yRange.min;
        charts.riskScatterPlot.options.scales.y.max = yRange.max;
        
    } else if (selectedFeature === 'bloodPressure') {
        // Blood Pressure vs Glucose
        charts.riskScatterPlot.data.datasets[0].data = nonDiabetic.map(d => ({
            x: d.bloodPressure,
            y: d.glucose
        })).slice(0, 100);
        
        charts.riskScatterPlot.data.datasets[1].data = diabetic.map(d => ({
            x: d.bloodPressure,
            y: d.glucose
        })).slice(0, 100);
        
        // Calculate dynamic ranges
        const xRange = calculateAxisRange(filteredData, 'bloodPressure', 5);
        const yRange = calculateAxisRange(filteredData, 'glucose', 5);
        
        charts.riskScatterPlot.options.scales.x.title.text = 'Blood Pressure (mmHg)';
        charts.riskScatterPlot.options.scales.y.title.text = 'Glucose Level (mg/dL)';
        charts.riskScatterPlot.options.scales.x.min = xRange.min;
        charts.riskScatterPlot.options.scales.x.max = xRange.max;
        charts.riskScatterPlot.options.scales.y.min = yRange.min;
        charts.riskScatterPlot.options.scales.y.max = yRange.max;
        
    } else if (selectedFeature === 'insulin') {
        // Insulin vs Glucose
        charts.riskScatterPlot.data.datasets[0].data = nonDiabetic.map(d => ({
            x: d.insulin,
            y: d.glucose
        })).slice(0, 100);
        
        charts.riskScatterPlot.data.datasets[1].data = diabetic.map(d => ({
            x: d.insulin,
            y: d.glucose
        })).slice(0, 100);
        
        // Calculate dynamic ranges
        const xRange = calculateAxisRange(filteredData, 'insulin', 10);
        const yRange = calculateAxisRange(filteredData, 'glucose', 5);
        
        charts.riskScatterPlot.options.scales.x.title.text = 'Insulin Level (μU/mL)';
        charts.riskScatterPlot.options.scales.y.title.text = 'Glucose Level (mg/dL)';
        charts.riskScatterPlot.options.scales.x.min = xRange.min;
        charts.riskScatterPlot.options.scales.x.max = xRange.max;
        charts.riskScatterPlot.options.scales.y.min = yRange.min;
        charts.riskScatterPlot.options.scales.y.max = yRange.max;
        
    } else if (selectedFeature === 'age') {
        // Age vs BMI
        charts.riskScatterPlot.data.datasets[0].data = nonDiabetic.map(d => ({
            x: d.age,
            y: d.bmi
        })).slice(0, 100);
        
        charts.riskScatterPlot.data.datasets[1].data = diabetic.map(d => ({
            x: d.age,
            y: d.bmi
        })).slice(0, 100);
        
        // Calculate dynamic ranges
        const xRange = calculateAxisRange(filteredData, 'age', 3);
        const yRange = calculateAxisRange(filteredData, 'bmi', 2);
        
        charts.riskScatterPlot.options.scales.x.title.text = 'Age (years)';
        charts.riskScatterPlot.options.scales.y.title.text = 'BMI';
        charts.riskScatterPlot.options.scales.x.min = xRange.min;
        charts.riskScatterPlot.options.scales.x.max = xRange.max;
        charts.riskScatterPlot.options.scales.y.min = yRange.min;
        charts.riskScatterPlot.options.scales.y.max = yRange.max;
    }
    
    // Update chart title based on selection
    const chartTitle = document.querySelector('.chart-container.wide .chart-header h2');
    if (chartTitle) {
        const titleMap = {
            'Glucose': '🔍 Glucose vs BMI Risk Map',
            'BMI': '🔍 BMI vs Age Analysis',
            'BloodPressure': '🔍 Blood Pressure vs Glucose Analysis', 
            'Insulin': '🔍 Insulin vs Glucose Correlation',
            'Age': '🔍 Age vs BMI Relationship'
        };
        chartTitle.textContent = titleMap[featureSelect] || '🔍 Feature Analysis';
    }
    
    charts.riskScatterPlot.update('active');
    console.log('Scatter plot updated with feature:', featureSelect);
}

function applyFilters() {
    const ageFilter = document.getElementById('ageFilter')?.value || 'all';
    const bmiFilter = document.getElementById('bmiFilter')?.value || 'all';
    
    console.log('Applying filters:', { ageFilter, bmiFilter });
    console.log('Original data length:', diabetesData.length);
    
    // Check BMI category distribution in original data
    const bmiCounts = {};
    diabetesData.forEach(patient => {
        bmiCounts[patient.bmiCategory] = (bmiCounts[patient.bmiCategory] || 0) + 1;
    });
    console.log('BMI category distribution:', bmiCounts);
    
    filteredData = diabetesData.filter(patient => {
        let ageMatch = true;
        let bmiMatch = true;
        
        if (ageFilter !== 'all') {
            ageMatch = patient.ageGroup === ageFilter;
        }
        
        if (bmiFilter !== 'all') {
            bmiMatch = patient.bmiCategory === bmiFilter;
        }
        
        return ageMatch && bmiMatch;
    });
    
    console.log('Filtered data length:', filteredData.length);
    console.log('Sample filtered data BMI categories:', 
        [...new Set(filteredData.map(d => d.bmiCategory))]);
    console.log('Sample filtered data age groups:', 
        [...new Set(filteredData.map(d => d.ageGroup))]);
}

// Risk calculator functions
function updateRiskCalculator() {
    const glucose = document.getElementById('glucoseInput')?.value || 100;
    const bmi = document.getElementById('bmiInput')?.value || 25;
    const age = document.getElementById('ageInput')?.value || 30;
    
    document.getElementById('glucoseValue').textContent = glucose;
    document.getElementById('bmiValue').textContent = bmi;
    document.getElementById('ageValue').textContent = age;
    
    calculateRisk(glucose, bmi, age);
}

function calculateRisk(glucose, bmi, age) {
    // Simple risk calculation based on known factors
    let riskScore = 0;
    
    // Glucose contribution (most important)
    if (glucose > 125) riskScore += 40;
    else if (glucose > 100) riskScore += 20;
    else riskScore += 5;
    
    // BMI contribution
    if (bmi > 35) riskScore += 25;
    else if (bmi > 30) riskScore += 15;
    else if (bmi > 25) riskScore += 8;
    else riskScore += 2;
    
    // Age contribution
    if (age > 60) riskScore += 20;
    else if (age > 45) riskScore += 12;
    else if (age > 30) riskScore += 6;
    else riskScore += 1;
    
    // Cap at 100%
    const riskPercentage = Math.min(riskScore, 100);
    
    const riskElement = document.getElementById('riskPercentage');
    const categoryElement = document.getElementById('riskCategory');
    
    if (riskElement) riskElement.textContent = riskPercentage.toFixed(0) + '%';
    
    let category, color;
    
    if (riskPercentage < 30) {
        category = 'Low Risk';
        color = colors.success;
    } else if (riskPercentage < 60) {
        category = 'Medium Risk';
        color = colors.warning;
    } else {
        category = 'High Risk';
        color = colors.danger;
    }
    
    if (categoryElement) {
        categoryElement.textContent = category;
        categoryElement.style.color = color;
    }
    
    // Update gauge chart
    if (charts.riskGaugeChart) {
        charts.riskGaugeChart.data.datasets[0].data = [riskPercentage, 100 - riskPercentage];
        charts.riskGaugeChart.data.datasets[0].backgroundColor[0] = color;
        charts.riskGaugeChart.update('none');
    }
}

// Update storytelling insights with real data
function updateStorytellingInsights() {
    if (filteredData.length === 0) return;
    
    try {
        // Calculate real statistics from the actual data
        const diabeticPatients = filteredData.filter(d => d.outcome === 1);
        const nonDiabeticPatients = filteredData.filter(d => d.outcome === 0);
        
        // Glucose statistics
        const diabeticHighGlucose = diabeticPatients.filter(d => d.glucose > 140).length;
        const glucosePercentage = diabeticPatients.length > 0 ? 
            Math.round((diabeticHighGlucose / diabeticPatients.length) * 100) : 0;
        
        // Age statistics
        const avgDiabeticAge = diabeticPatients.length > 0 ?
            Math.round(diabeticPatients.reduce((sum, d) => sum + d.age, 0) / diabeticPatients.length) : 0;
        
        // BMI statistics
        const avgDiabeticBMI = diabeticPatients.length > 0 ?
            (diabeticPatients.reduce((sum, d) => sum + d.bmi, 0) / diabeticPatients.length).toFixed(1) : 0;
        
        // Update the storytelling elements with real data
        const realGlucoseElement = document.getElementById('realGlucoseStat');
        const realAgeElement = document.getElementById('realAgeStat');
        const realBMIElement = document.getElementById('realBMIStat');
        
        if (realGlucoseElement) realGlucoseElement.textContent = `${glucosePercentage}%`;
        if (realAgeElement) realAgeElement.textContent = `${avgDiabeticAge} years`;
        if (realBMIElement) realBMIElement.textContent = `${avgDiabeticBMI}`;
        
        console.log('📚 Storytelling updated with real data statistics');
        console.log(`   - High glucose in diabetics: ${glucosePercentage}%`);
        console.log(`   - Avg diabetic age: ${avgDiabeticAge} years`);
        console.log(`   - Avg diabetic BMI: ${avgDiabeticBMI}`);
        
    } catch (error) {
        console.error('Error updating storytelling insights:', error);
    }
}

// Utility functions
function calculateCorrelation(x, y) {
    const n = x.length;
    if (n === 0) return 0;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function calculateAxisRange(data, feature, padding = 2) {
    if (!data || data.length === 0) {
        return { min: 0, max: 100 };
    }
    
    const values = data.map(d => d[feature]).filter(v => v != null && !isNaN(v));
    if (values.length === 0) {
        return { min: 0, max: 100 };
    }
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    
    // Add padding (default 2 units beyond min/max)
    const paddedMin = Math.max(0, min - padding);
    const paddedMax = max + padding;
    
    return {
        min: Math.floor(paddedMin),
        max: Math.ceil(paddedMax)
    };
}

function updateInsightsList(listId, insights) {
    const list = document.getElementById(listId);
    if (!list) return;
    
    list.innerHTML = '';
    insights.forEach(insight => {
        const li = document.createElement('li');
        li.textContent = insight;
        list.appendChild(li);
    });
}

// Export and utility functions
function exportDashboard() {
    const report = generateReport();
    downloadReport(report, 'diabetes-analysis-report.txt');
}

function printDashboard() {
    window.print();
}

function generateReport() {
    const totalPatients = filteredData.length;
    const diabeticPatients = filteredData.filter(d => d.outcome === 1).length;
    const prevalence = ((diabeticPatients / totalPatients) * 100).toFixed(1);
    
    return `
DIABETES RISK ANALYSIS REPORT
Generated: ${new Date().toLocaleDateString()}

SUMMARY STATISTICS:
- Total Patients: ${totalPatients}
- Diabetes Cases: ${diabeticPatients}
- Prevalence Rate: ${prevalence}%

KEY FINDINGS:
- Glucose level is the strongest predictor of diabetes risk
- Age and BMI significantly contribute to risk assessment
- Patients over 50 show elevated diabetes rates
- BMI above 30 correlates with increased diabetes risk

RECOMMENDATIONS:
- Implement regular glucose screening for at-risk populations
- Focus on lifestyle interventions for overweight patients
- Increase monitoring frequency for patients over 45
- Develop targeted prevention programs

This report was generated from the Interactive Diabetes Risk Dashboard.
    `;
}

function downloadReport(content, filename) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

// Reset filters function
function resetFilters() {
    console.log('resetFilters() called');
    
    const ageFilter = document.getElementById('ageFilter');
    const bmiFilter = document.getElementById('bmiFilter');
    const featureSelect = document.getElementById('featureSelect');
    
    if (ageFilter) {
        ageFilter.value = 'all';
        console.log('Age filter reset to:', ageFilter.value);
    }
    if (bmiFilter) {
        bmiFilter.value = 'all';
        console.log('BMI filter reset to:', bmiFilter.value);
    }
    if (featureSelect) {
        featureSelect.value = 'Glucose';
        console.log('Feature select reset to:', featureSelect.value);
    }
    
    filteredData = [...diabetesData];
    console.log('Data reset - filtered length:', filteredData.length);
    
    updateSummaryStats();
    updateAllCharts();
    updateStorytellingInsights();
}
