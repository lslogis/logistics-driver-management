// Simple test script for fixed routes functionality

async function testFixedRoutesSimple() {
  console.log('Testing Fixed Routes API directly...\n');
  
  // First, let's create a loading point directly in the database using a manual approach
  // We'll use the seed data that should exist in the database after migration
  
  // 1. Get loading points to use one for testing
  console.log('1. Getting available loading points...');
  const loadingPointsResponse = await fetch('http://localhost:3000/api/loading-points');
  const loadingPointsResult = await loadingPointsResponse.json();
  
  console.log('Loading Points Response:', JSON.stringify(loadingPointsResult, null, 2));
  
  if (!loadingPointsResult.ok) {
    console.error('Failed to get loading points:', loadingPointsResult.error);
    return;
  }
  
  // If no loading points exist, we cannot test fixed routes
  if (!loadingPointsResult.data.items || loadingPointsResult.data.items.length === 0) {
    console.log('No loading points found. Creating one via simple API call...');
    
    // Try a very simple API call
    const createResponse = await fetch('http://localhost:3000/api/loading-points', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        centerName: '테스트센터',
        loadingPointName: '테스트상차지'
      })
    });
    
    const createResult = await createResponse.json();
    console.log('Create loading point result:', createResult);
    
    if (!createResult.ok) {
      console.error('Cannot proceed without a loading point');
      return;
    }
    
    var loadingPointId = createResult.data.id;
  } else {
    var loadingPointId = loadingPointsResult.data.items[0].id;
  }
  
  console.log('Using loading point ID:', loadingPointId);
  
  // 2. Create a fixed route
  console.log('\n2. Creating a fixed route...');
  const fixedRouteData = {
    loadingPointId: loadingPointId,
    routeName: '강남-수원 노선',
    weekdayPattern: [1, 2, 3, 4, 5], // Monday to Friday as numbers
    contractType: 'FIXED_DAILY',
    revenueDaily: '150000',
    costDaily: '120000',
    remarks: '테스트 고정노선'
  };
  
  const fixedRouteResponse = await fetch('http://localhost:3000/api/fixed-routes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fixedRouteData)
  });
  
  const fixedRouteResult = await fixedRouteResponse.json();
  console.log('Fixed Route Response:', JSON.stringify(fixedRouteResult, null, 2));
  
  if (!fixedRouteResult.ok) {
    console.error('Failed to create fixed route:', fixedRouteResult.error);
    return;
  }
  
  const fixedRouteId = fixedRouteResult.data.id;
  console.log('Created fixed route with ID:', fixedRouteId);
  
  // 3. Get fixed routes list
  console.log('\n3. Getting fixed routes list...');
  const listResponse = await fetch('http://localhost:3000/api/fixed-routes');
  const listResult = await listResponse.json();
  
  if (listResult.ok && listResult.data.fixedRoutes) {
    console.log(`Found ${listResult.data.fixedRoutes.length} fixed routes`);
    console.log('First fixed route:', JSON.stringify(listResult.data.fixedRoutes[0], null, 2));
  } else {
    console.log('List Response:', JSON.stringify(listResult, null, 2));
  }
  
  console.log('\n✅ Fixed Routes API test completed!');
}

// Run the test
testFixedRoutesSimple().catch(console.error);