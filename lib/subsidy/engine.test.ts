import { evaluateSubsidyPath, detectGrayZone } from './engine';
import { SubsidyRequest } from './types';

// Mock request
const baseReq: SubsidyRequest = {
  city: 'Taipei',
  identity: 'General',
  category: 'Purchase',
  progress: 'PreSubmit',
  specialCondition: 'None',
  documentsComplete: true,
};

// Simple test runner concept (since we don't know the exact test framework used in this project)
export function runTests() {
  console.log('Running Subsidy Engine Tests...');
  let passed = 0;
  let failed = 0;

  function assertEqual(testName: string, actual: any, expected: any) {
    if (actual === expected) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} | Expected ${expected}, got ${actual}`);
      failed++;
    }
  }

  // Test 1: Standard Green Path
  const resultA = evaluateSubsidyPath(baseReq);
  assertEqual('Test Standard Path A', resultA.path, 'A');

  // Test 2: Progress PreEvaluation (Yellow Path)
  const resultB = evaluateSubsidyPath({ ...baseReq, progress: 'PreEvaluation' });
  assertEqual('Test Pre-Evaluation Path B', resultB.path, 'B');

  // Test 3: Gray Zone - Dual Identity (Red Path)
  const resultC1 = evaluateSubsidyPath({ ...baseReq, identity: 'DualIdentity' });
  assertEqual('Test Dual Identity Path C', resultC1.path, 'C');
  assertEqual('Test Dual Identity Category', resultC1.grayZoneCategory, 'Qualification');

  // Test 4: Gray Zone - Rule Difference (Taoyuan)
  const resultC2 = evaluateSubsidyPath({ ...baseReq, city: 'Taoyuan' });
  assertEqual('Test Taoyuan Rule Gray Zone', resultC2.path, 'C');
  assertEqual('Test Taoyuan Rule Gray Zone Category', resultC2.grayZoneCategory, 'Rule');
  
  // Test 5: Incomplete Documents
  const resultC3 = evaluateSubsidyPath({ ...baseReq, documentsComplete: false });
  assertEqual('Test Incomplete Documents Path C', resultC3.path, 'C');
  assertEqual('Test Incomplete Documents Category', resultC3.grayZoneCategory, 'Document');

  console.log(`\nTests completed: ${passed} passed, ${failed} failed.`);
}

// In a real Node environment, you might run this if invoked directly.
if (typeof require !== 'undefined' && require.main === module) {
  runTests();
}
