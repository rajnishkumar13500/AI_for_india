import dotenv from 'dotenv';
dotenv.config();

async function testEndToEndTransaction() {
  console.log('1. Starting Session...');
  const startRes = await fetch('http://localhost:5000/api/sessions/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ merchantId: 'M001' })
  });
  const startData = await startRes.json();
  const sessionId = startData.data.id;
  console.log('Session Created:', sessionId);

  console.log('\n2. Submitting Real-time Voice Order: "Bhaiya 1 packet Parle-G, 2 packet Britannia bread aur 1 packet Amul butter dena"...');
  const voiceRes = await fetch(`http://localhost:5000/api/sessions/${sessionId}/voice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: 'Bhaiya 1 packet Parle-G, 2 packet Britannia bread aur 1 packet Amul butter dena',
      lang: 'hi-IN'
    })
  });
  const voiceData = await voiceRes.json();
  console.log('Live Extracted Data:\n', JSON.stringify(voiceData.data?.extraction || voiceData.data, null, 2));

  console.log('\n3. Simulating Payment...');
  const paymentRes = await fetch('http://localhost:5000/api/payments/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: sessionId,
      merchantId: 'M001',
      amount: 145
    })
  });
  const paymentData = await paymentRes.json();
  console.log('Payment & Reconciliation Result:\n', JSON.stringify(paymentData.data?.reconciliation || paymentData.data, null, 2));
}

testEndToEndTransaction();
