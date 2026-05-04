/**
 * ChurnGuard AI — Frontend Logic
 * Handles multi-step form, recommendations, and results
 */

document.addEventListener('DOMContentLoaded', () => {
    loadModelInfo();
    setupMultiStepForm();
    setupNavigation();
});

// ─── Load Model Info ───
async function loadModelInfo() {
    try {
        const response = await fetch('/api/model-info');
        const data = await response.json();

        // Update hero stats
        animateNumber('stat-accuracy', data.accuracy * 100, '%');
        animateNumber('stat-auc', data.roc_auc * 100, '%');
        animateNumber('stat-f1', data.f1_score * 100, '%');

        // Update header badge
        document.getElementById('badge-model-name').textContent = data.model_name;

        // Render feature importance chart
        renderFeatureChart(data.feature_importances);

        // Render model comparison table
        renderModelTable(data.model_results, data.model_name);

    } catch (error) {
        console.error('Failed to load model info:', error);
        document.getElementById('badge-model-name').textContent = 'Offline';
    }
}

// ─── Multi-Step Form Logic ───
function setupMultiStepForm() {
    const steps = document.querySelectorAll('.form-step');
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');
    const predictBtn = document.getElementById('predict-btn');
    const dots = document.querySelectorAll('.step-dot');
    let currentStep = 1;

    function updateStep(step) {
        steps.forEach(s => s.classList.remove('active'));
        document.querySelector(`.form-step[data-step="${step}"]`).classList.add('active');
        
        // Buttons
        prevBtn.classList.toggle('hidden', step === 1);
        if (step === steps.length) {
            nextBtn.classList.add('hidden');
            predictBtn.classList.remove('hidden');
        } else {
            nextBtn.classList.remove('hidden');
            predictBtn.classList.add('hidden');
        }

        // Dots
        dots.forEach(dot => {
            const dotStep = parseInt(dot.dataset.step);
            dot.classList.toggle('active', dotStep === step);
            dot.classList.toggle('completed', dotStep < step);
        });

        currentStep = step;
    }

    nextBtn.addEventListener('click', () => {
        if (currentStep < steps.length) updateStep(currentStep + 1);
    });

    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) updateStep(currentStep - 1);
    });

    dots.forEach(dot => {
        dot.addEventListener('click', () => updateStep(parseInt(dot.dataset.step)));
    });

    // Range input value syncing
    document.querySelectorAll('.sync-input').forEach(input => {
        input.addEventListener('input', (e) => {
            const id = e.target.id;
            const val = e.target.value;
            const display = document.getElementById(`${id.split('M')[0]}-val`);
            if (display) {
                if (id === 'monthlyCharge') display.textContent = `$${parseFloat(val).toFixed(2)}`;
                else if (id === 'tenureMonths') display.textContent = `${val} months`;
                else display.textContent = val;
            }
            updateCalculatedFields();
        });
    });

    const form = document.getElementById('prediction-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await makePrediction();
    });

    updateCalculatedFields();
}

function updateCalculatedFields() {
    const tenure = parseFloat(document.getElementById('tenureMonths').value || 1);
    const monthly = parseFloat(document.getElementById('monthlyCharge').value || 0);
    const totalInput = document.getElementById('totalCharges');
    const revenueInput = document.getElementById('totalRevenue');

    // Simple heuristic for total charges if not manually overridden
    const estimatedTotal = tenure * monthly;
    totalInput.value = estimatedTotal.toFixed(2);
    revenueInput.value = (estimatedTotal * 1.2).toFixed(2); // Assume 20% extra revenue from services
}

// ─── Make Prediction ───
async function makePrediction() {
    const btn = document.getElementById('predict-btn');
    btn.classList.add('loading');
    btn.textContent = 'Analyzing...';

    // Collect Data
    const formData = {};
    const inputs = document.querySelectorAll('#prediction-form input, #prediction-form select');
    inputs.forEach(input => {
        if (input.type === 'checkbox') {
            formData[input.id.charAt(0).toUpperCase() + input.id.slice(1)] = input.checked ? 'Yes' : 'No';
        } else if (input.name) {
            formData[input.name] = input.value;
        } else if (input.id) {
            // Mapping for IDs without names
            const key = input.id.charAt(0).toUpperCase() + input.id.slice(1);
            formData[key] = input.value;
        }
    });

    try {
        const response = await fetch('/api/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        if (result.success) displayResult(result, formData);
        else alert('Error: ' + result.error);
    } catch (error) {
        alert('Failed to connect to AI server.');
    } finally {
        btn.classList.remove('loading');
        btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2L18 10L10 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 10H2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Generate Prediction`;
    }
}

// ─── Display Result ───
function displayResult(result, inputData) {
    document.getElementById('result-placeholder').classList.add('hidden');
    document.getElementById('result-content').classList.remove('hidden');

    const prob = result.churn_probability;
    const isChurn = result.prediction === 'Churned';

    animateGauge(prob);
    
    const badge = document.getElementById('prediction-badge');
    badge.className = `prediction-badge ${isChurn ? 'churn' : 'no-churn'}`;
    document.getElementById('badge-icon').textContent = isChurn ? '⚠' : '✓';
    document.getElementById('prediction-label').textContent = isChurn ? 'High Churn Risk' : 'Low Churn Risk';

    const riskTag = document.getElementById('risk-tag');
    riskTag.textContent = `${result.risk_level} Risk`;
    riskTag.className = `risk-tag ${result.risk_level.toLowerCase()}`;

    // Bars
    setTimeout(() => {
        document.getElementById('churn-bar').style.width = `${prob}%`;
        document.getElementById('retain-bar').style.width = `${result.retention_probability}%`;
    }, 100);
    document.getElementById('churn-pct').textContent = `${prob}%`;
    document.getElementById('retain-pct').textContent = `${result.retention_probability}%`;

    // Risk Factors & Recommendations
    const riskCard = document.getElementById('risk-card');
    const riskList = document.getElementById('risk-list');
    const recText = document.getElementById('rec-text');

    riskCard.classList.remove('hidden');
    
    if (result.risk_factors.length > 0) {
        riskList.innerHTML = result.risk_factors.map(f => `<li>⚡ ${f}</li>`).join('');
    } else {
        riskList.innerHTML = '<li>✨ No immediate major risk factors detected.</li>';
    }

    // Dynamic Recommendation
    let rec = "Maintain regular contact and monitor satisfaction.";
    if (isChurn) {
        if (inputData['Contract'] === 'Month-to-Month') rec = "Offer a 15% discount for switching to a 1-year contract.";
        else if (parseFloat(inputData['Monthly Charge']) > 80) rec = "Suggest a value bundle to reduce monthly costs while retaining core services.";
        else if (inputData['Offer'] === 'None') rec = "Target with 'Retention Offer B' (Premium support + 1 month free).";
    } else if (prob > 30) {
        rec = "Provide a complimentary security service trial to increase ecosystem stickiness.";
    }
    recText.textContent = rec;
}

// ─── Animations ───
function animateNumber(id, target, suffix = '') {
    const el = document.getElementById(id);
    let current = 0;
    const interval = setInterval(() => {
        current += target / 30;
        if (current >= target) {
            el.textContent = target.toFixed(1) + suffix;
            clearInterval(interval);
        } else el.textContent = current.toFixed(1) + suffix;
    }, 30);
}

function animateGauge(percentage) {
    const fill = document.getElementById('gauge-fill');
    const text = document.getElementById('gauge-text');
    const len = 251.33;
    fill.setAttribute('stroke-dasharray', `${(percentage / 100) * len} ${len}`);
    text.textContent = Math.round(percentage) + '%';
}

function renderFeatureChart(importances) {
    const chart = document.getElementById('feature-chart');
    const sorted = Object.entries(importances).sort((a,b) => b[1]-a[1]).slice(0, 15);
    const max = sorted[0][1];
    chart.innerHTML = sorted.map(([k, v]) => `
        <div class="feature-bar-row">
            <span class="feature-name" title="${k}">${formatFeatureLabel(k)}</span>
            <div class="feature-bar-track"><div class="feature-bar-fill" style="width: ${(v/max)*100}%"></div></div>
        </div>
    `).join('');
}

function formatFeatureLabel(featureName) {
    if (!featureName.includes('_')) {
        return featureName;
    }

    const [category, ...parts] = featureName.split('_');
    const suffix = parts.join(' ');
    return suffix ? `${category}: ${suffix}` : category;
}

function renderModelTable(results, best) {
    const tbody = document.getElementById('model-table-body');
    tbody.innerHTML = Object.entries(results).map(([name, m]) => `
        <tr class="${name === best ? 'best-model' : ''}">
            <td>${name} ${name === best ? '⭐' : ''}</td>
            <td>${(m.accuracy*100).toFixed(1)}%</td>
            <td>${(m.precision*100).toFixed(1)}%</td>
            <td>${(m.recall*100).toFixed(1)}%</td>
            <td>${(m.f1_score*100).toFixed(1)}%</td>
            <td>${(m.roc_auc*100).toFixed(1)}%</td>
        </tr>
    `).join('');
}

function setupNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
}
