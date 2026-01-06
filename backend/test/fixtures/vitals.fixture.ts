export const normalVitals = {
  weight: 75.5,
  height: 175,
  temperature: 37.2,
  bloodPressure: {
    systolic: 120,
    diastolic: 80,
  },
  heartRate: 72,
  respiratoryRate: 16,
  oxygenSaturation: 98,
};

export const abnormalVitals = {
  highTemperature: {
    ...normalVitals,
    temperature: 39.5,
  },
  lowOxygenSaturation: {
    ...normalVitals,
    oxygenSaturation: 88,
  },
  highBloodPressure: {
    ...normalVitals,
    bloodPressure: {
      systolic: 160,
      diastolic: 95,
    },
  },
  lowBloodPressure: {
    ...normalVitals,
    bloodPressure: {
      systolic: 90,
      diastolic: 60,
    },
  },
  tachycardia: {
    ...normalVitals,
    heartRate: 120,
  },
  bradycardia: {
    ...normalVitals,
    heartRate: 50,
  },
};

export const invalidVitals = {
  negativeWeight: {
    ...normalVitals,
    weight: -5,
  },
  extremeTemperature: {
    ...normalVitals,
    temperature: 50,
  },
  invalidBloodPressure: {
    ...normalVitals,
    bloodPressure: {
      systolic: 300,
      diastolic: 200,
    },
  },
};
