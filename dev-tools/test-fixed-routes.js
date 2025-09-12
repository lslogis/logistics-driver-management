// Test script for fixed routes functionality

async function testFixedRoutes() {
  const baseUrl = 'http://localhost:3000/api';
  
  console.log('Testing Fixed Routes API...\n');
  
  // 1. First, create a loading point
  console.log('1. Creating a loading point...');
  const loadingPointResponse = await fetch(`${baseUrl}/loading-points`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      centerName: '서울센터',
      loadingPointName: '강남상차지',
      lotAddress: '서울특별시 강남구 역삼동 123-45',
      roadAddress: '서울특별시 강남구 테헤란로 123',
      manager1: '김관리',
      phone1: '010-1234-5678',
      remarks: '테스트 상차지'
    })
  });
  
  const loadingPointResult = await loadingPointResponse.json();
  console.log('Loading Point Response:', loadingPointResult);
  
  if (!loadingPointResult.ok) {
    console.error('Failed to create loading point:', loadingPointResult.error);
    return;
  }
  
  const loadingPointId = loadingPointResult.data.id;
  console.log('Created loading point with ID:', loadingPointId);
  
  // 2. Create a fixed route
  console.log('\n2. Creating a fixed route...');
  const fixedRouteData = {
    loadingPointId: loadingPointId,
    routeName: '강남-수원 노선',
    weekdayPattern: [1, 2, 3, 4, 5], // Monday to Friday
    contractType: 'FIXED_DAILY',
    revenueDaily: 150000,
    costDaily: 120000,
    remarks: '테스트 고정노선'
  };
  
  const fixedRouteResponse = await fetch(`${baseUrl}/fixed-routes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fixedRouteData)
  });
  
  const fixedRouteResult = await fixedRouteResponse.json();
  console.log('Fixed Route Response:', fixedRouteResult);
  
  if (!fixedRouteResult.ok) {
    console.error('Failed to create fixed route:', fixedRouteResult.error);
    return;
  }
  
  const fixedRouteId = fixedRouteResult.data.id;
  console.log('Created fixed route with ID:', fixedRouteId);
  
  // 3. Get fixed routes list
  console.log('\n3. Getting fixed routes list...');
  const listResponse = await fetch(`${baseUrl}/fixed-routes`);
  const listResult = await listResponse.json();
  console.log('List Response:', JSON.stringify(listResult, null, 2));
  
  // 4. Update the fixed route
  console.log('\n4. Updating the fixed route...');
  const updateResponse = await fetch(`${baseUrl}/fixed-routes/${fixedRouteId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      routeName: '강남-수원 특급 노선',
      revenueDaily: 180000,
      costDaily: 140000
    })
  });
  
  const updateResult = await updateResponse.json();
  console.log('Update Response:', updateResult.ok ? 'Success' : updateResult.error);
  
  // 5. Get specific fixed route
  console.log('\n5. Getting specific fixed route...');
  const getResponse = await fetch(`${baseUrl}/fixed-routes/${fixedRouteId}`);
  const getResult = await getResponse.json();
  console.log('Get Response:', JSON.stringify(getResult.data, null, 2));
  
  console.log('\n✅ Fixed Routes API test completed!');
}

// Run the test
testFixedRoutes().catch(console.error);