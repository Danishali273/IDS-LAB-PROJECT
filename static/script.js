/**
 * ChurnGuard AI — Frontend Logic
 * Handles form submission, API calls, and animated result display
 */

document.addEventListener('DOMContentLoaded', () => {
    loadModelInfo();
    setupForm();
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

// ─── Animate Number ───
function animateNumber(elementId, target, suffix = '') {
    const el = document.getElementById(elementId);
    const duration = 1500;
    const start = performance.now();
    const startVal = 0;

    function update(currentTime) {
        const elapsed = currentTime - start;
        const progress = Math.min(elapsed / duration, 1);
        // ease out quad
        const eased = 1 - (1 - progress) * (1 - progress);
        const current = startVal + (target - startVal) * eased;
        el.textContent = current.toFixed(1) + suffix;
        if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
}

// ─── Setup Form ───
function setupForm() {
    const form = document.getElementById('prediction-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await makePrediction();
    });

    // Auto-calculate totals from key billing inputs
    const tenureInput = document.getElementById('tenureMonths');
    const monthlyInput = document.getElementById('monthlyCharge');
    const totalInput = document.getElementById('totalCharges');
    const longDistanceAvgInput = document.getElementById('avgMonthlyLongDistanceCharges');
    const longDistanceTotalInput = document.getElementById('totalLongDistanceCharges');
    const revenueInput = document.getElementById('totalRevenue');
    const refundsInput = document.getElementById('totalRefunds');
    const extraDataInput = document.getElementById('totalExtraDataCharges');

    function updateTotalCharges() {
        const tenure = parseFloat(tenureInput.value || 0);
        const monthly = parseFloat(monthlyInput.value || 0);
        const avgLongDistance = parseFloat(longDistanceAvgInput.value || 0);
        const refunds = parseFloat(refundsInput.value || 0);
        const extraData = parseFloat(extraDataInput.value || 0);

        const totalCharges = tenure * monthly;
        const totalLongDistance = tenure * avgLongDistance;
        const totalRevenue = totalCharges + totalLongDistance + extraData - refunds;

        totalInput.value = totalCharges.toFixed(2);
        longDistanceTotalInput.value = totalLongDistance.toFixed(2);
        revenueInput.value = totalRevenue.toFixed(2);
    }

    tenureInput.addEventListener('input', updateTotalCharges);
    monthlyInput.addEventListener('input', updateTotalCharges);
    longDistanceAvgInput.addEventListener('input', updateTotalCharges);
    refundsInput.addEventListener('input', updateTotalCharges);
    extraDataInput.addEventListener('input', updateTotalCharges);
    updateTotalCharges();
}

// ─── Make Prediction ───
async function makePrediction() {
    const btn = document.getElementById('predict-btn');
    btn.classList.add('loading');
    btn.textContent = 'Analyzing...';

    const formData = {
        'Gender': document.getElementById('gender').value,
        'Age': document.getElementById('age').value,
        'Married': document.getElementById('married').value,
        'Number of Dependents': document.getElementById('numberOfDependents').value,
        'Number of Referrals': document.getElementById('numberOfReferrals').value,
        'Tenure in Months': document.getElementById('tenureMonths').value,
        'Offer': document.getElementById('offer').value,
        'Phone Service': document.getElementById('phoneService').value,
        'Avg Monthly Long Distance Charges': document.getElementById('avgMonthlyLongDistanceCharges').value,
        'Multiple Lines': document.getElementById('multipleLines').value,
        'Internet Service': document.getElementById('internetService').value,
        'Internet Type': document.getElementById('internetType').value,
        'Avg Monthly GB Download': document.getElementById('avgMonthlyGbDownload').value,
        'Online Security': document.getElementById('onlineSecurity').value,
        'Online Backup': document.getElementById('onlineBackup').value,
        'Device Protection Plan': document.getElementById('deviceProtectionPlan').value,
        'Premium Tech Support': document.getElementById('premiumTechSupport').value,
        'Streaming TV': document.getElementById('streamingTv').value,
        'Streaming Movies': document.getElementById('streamingMovies').value,
        'Streaming Music': document.getElementById('streamingMusic').value,
        'Unlimited Data': document.getElementById('unlimitedData').value,
        'Contract': document.getElementById('contract').value,
        'Paperless Billing': document.getElementById('paperlessBilling').value,
        'Payment Method': document.getElementById('paymentMethod').value,
        'Monthly Charge': document.getElementById('monthlyCharge').value,
        'Total Charges': document.getElementById('totalCharges').value,
        'Total Refunds': document.getElementById('totalRefunds').value,
        'Total Extra Data Charges': document.getElementById('totalExtraDataCharges').value,
        'Total Long Distance Charges': document.getElementById('totalLongDistanceCharges').value,
        'Total Revenue': document.getElementById('totalRevenue').value
    };

    try {
        const response = await fetch('/api/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
            displayResult(result);
        } else {
            alert('Prediction error: ' + result.error);
        }
    } catch (error) {
        console.error('Prediction failed:', error);
        alert('Failed to connect to the server. Make sure the Flask app is running.');
    } finally {
        btn.classList.remove('loading');
        btn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2L18 10L10 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 10H2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            Predict Churn
        `;
    }
}

// ─── Display Result ───
function displayResult(result) {
    // Show result content, hide placeholder
    document.getElementById('result-placeholder').classList.add('hidden');
    document.getElementById('result-content').classList.remove('hidden');

    const isChurn = result.prediction === 'Churned';
    const probability = result.churn_probability;

    // Animate gauge
    animateGauge(probability);

    // Update prediction badge
    const badge = document.getElementById('prediction-badge');
    badge.className = `prediction-badge ${isChurn ? 'churn' : 'no-churn'}`;
    document.getElementById('badge-icon').textContent = isChurn ? '⚠' : '✓';
    document.getElementById('prediction-label').textContent = isChurn ? 'Customer Will Churn' : 'Customer Will Stay';

    // Risk level
    const riskTag = document.getElementById('risk-tag');
    riskTag.textContent = result.risk_level;
    riskTag.className = `risk-tag ${result.risk_level.toLowerCase()}`;

    // Probability bars
    setTimeout(() => {
        document.getElementById('churn-bar').style.width = `${probability}%`;
        document.getElementById('retain-bar').style.width = `${result.retention_probability}%`;
    }, 100);
    document.getElementById('churn-pct').textContent = `${probability}%`;
    document.getElementById('retain-pct').textContent = `${result.retention_probability}%`;

    // Risk factors
    const riskCard = document.getElementById('risk-card');
    const riskList = document.getElementById('risk-list');

    if (result.risk_factors && result.risk_factors.length > 0) {
        riskCard.classList.remove('hidden');
        riskList.innerHTML = result.risk_factors.map(factor =>
            `<li><span class="risk-icon">⚡</span>${factor}</li>`
        ).join('');
    } else {
        riskCard.classList.add('hidden');
    }
}

// ─── Animate Gauge ───
function animateGauge(percentage) {
    const gaugeFill = document.getElementById('gauge-fill');
    const gaugeText = document.getElementById('gauge-text');
    const totalLength = 251.33; // circumference of the arc
    const targetDash = (percentage / 100) * totalLength;

    const duration = 1500;
    const start = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease out cubic

        const currentDash = targetDash * eased;
        gaugeFill.setAttribute('stroke-dasharray', `${currentDash} ${totalLength}`);
        gaugeText.textContent = Math.round(percentage * eased) + '%';

        if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
}

// ─── Render Feature Chart ───
function renderFeatureChart(importances) {
    const container = document.getElementById('feature-chart');
    if (!importances) return;

    // Sort by importance and take top 15
    const sorted = Object.entries(importances)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);

    const maxVal = sorted[0][1];

    container.innerHTML = sorted.map(([name, value]) => {
        const pct = (value / maxVal) * 100;
        const displayName = name
            .replace(/_/g, ' ')
            .replace('InternetService', 'Internet: ')
            .replace('Contract', 'Contract: ')
            .replace('PaymentMethod', 'Payment: ');

        return `
            <div class="feature-bar-row">
                <span class="feature-name" title="${name}">${displayName}</span>
                <div class="feature-bar-track">
                    <div class="feature-bar-fill" style="width: 0%;" data-width="${pct}%">
                        <span class="feature-bar-value">${(value * 100).toFixed(1)}%</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Animate bars on scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const bars = container.querySelectorAll('.feature-bar-fill');
                bars.forEach((bar, i) => {
                    setTimeout(() => {
                        bar.style.width = bar.dataset.width;
                    }, i * 80);
                });
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    observer.observe(container);
}

// ─── Render Model Table ───
function renderModelTable(results, bestModelName) {
    const tbody = document.getElementById('model-table-body');
    if (!results) return;

    // Sort by ROC-AUC descending
    const sorted = Object.entries(results)
        .sort((a, b) => b[1].roc_auc - a[1].roc_auc);

    tbody.innerHTML = sorted.map(([name, metrics]) => {
        const isBest = name === bestModelName;
        return `
            <tr class="${isBest ? 'best-model' : ''}">
                <td>
                    <span class="model-name">${name}</span>
                    ${isBest ? '<span class="best-badge">Best</span>' : ''}
                </td>
                <td><span class="metric-value ${getMetricClass(metrics.accuracy)}">${(metrics.accuracy * 100).toFixed(1)}%</span></td>
                <td><span class="metric-value ${getMetricClass(metrics.precision)}">${(metrics.precision * 100).toFixed(1)}%</span></td>
                <td><span class="metric-value ${getMetricClass(metrics.recall)}">${(metrics.recall * 100).toFixed(1)}%</span></td>
                <td><span class="metric-value ${getMetricClass(metrics.f1_score)}">${(metrics.f1_score * 100).toFixed(1)}%</span></td>
                <td><span class="metric-value ${getMetricClass(metrics.roc_auc)}">${(metrics.roc_auc * 100).toFixed(1)}%</span></td>
            </tr>
        `;
    }).join('');
}

function getMetricClass(value) {
    if (value >= 0.8) return 'good';
    if (value >= 0.6) return 'medium';
    return 'low';
}

// ─── Navigation ───
function setupNavigation() {
    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            links.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
}
