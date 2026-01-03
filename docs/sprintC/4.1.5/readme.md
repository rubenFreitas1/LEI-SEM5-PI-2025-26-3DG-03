# US 4.1.5

## 1. Context

*This user story focuses on improving operational oversight by enabling Logistics Operators to quickly identify Vessel Visit Notifications (VVNs) that lack associated Operation Plans. By providing a dedicated interface for detecting missing plans and offering the ability to regenerate all Operation Plans for a specific day, operators can ensure comprehensive coverage and maintain consistent planning standards across all scheduled vessel visits.*

## 2. Requirements

**US 4.1.5** As a Logistics Operator, I want to identify Vessel Visit Notifications (VVNs) that do not yet have an Operation Plan, so that missing plans can be easily detected and generated.

**Acceptance Criteria:**

- The REST API must provide an endpoint that returns all VVNs without associated Operation Plans.

- The SPA must display these VVNs in a dedicated "Missing Plans" tab, grouped by Expected Time of Arrival (ETA) date for easy visualization.

- The system must allow operators to regenerate all Operation Plans for a specific day, with the ability to select the scheduling algorithm to use.

- Before regenerating, the system must warn operators that existing plans for that date will be overwritten, requiring explicit confirmation.

- All regenerated Operation Plans must record metadata including creation date, author (system user who triggered the regeneration), and the algorithm used.

- The date field in the regeneration modal must be automatically populated from the selected date group and be read-only to prevent accidental changes.

**Dependencies/References:**

*This user story depends on US 4.1.2 (Create Operation Plan) because VVNs must have the possibility of having Operation Plans created before they can be identified as missing. It also depends on US 2.2.8 (Manage VVN) since it queries and displays Vessel Visit Notifications.*


**Forum Insight:**

*There are no forum insights related to this User Story!*


## 3. Analysis

Identify VVNs Without Operation Plans

![System Sequence Diagram ](images/system-sequence-diagram-US4.1.5.png)

## 4. C4 Model


#### Components - Level 3

![Components](images/components_lvl3.png)

#### Code - Level 4

![Code](images/code_lvl4.png)


## 5. Tests

### Backend Tests

#### Service Layer Tests
Tests for the Operation Plan Service methods that identify missing plans and handle regeneration:

```ts
describe('OperationPlanService - Missing Plans', () => {
  it('should identify VVNs without operation plans', async () => {
    // Arrange: Mock VVN client to return VVNs
    const mockVvns = [
      { code: 'VVN-001', vesselName: 'Vessel A', eta: '2026-01-15' },
      { code: 'VVN-002', vesselName: 'Vessel B', eta: '2026-01-15' }
    ];
    
    vesselVisitNotificationClientMock.getAllVvns.mockResolvedValue(mockVvns);
    
    // Mock repository to return only one existing plan
    operationPlanRepoMock.findAll.mockResolvedValue([
      { vvnCode: 'VVN-001' }
    ]);

    // Act
    const result = await operationPlanService.getVvnsWithoutOperationPlan();

    // Assert
    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toHaveLength(1);
    expect(result.getValue()[0].code).toBe('VVN-002');
  });

  it('should regenerate plans for all VVNs on a specific date', async () => {
    // Arrange
    const targetDate = '2026-01-15';
    const algorithm = 'genetic';
    const userId = 'user-123';

    const mockVvns = [
      { code: 'VVN-001', eta: targetDate },
      { code: 'VVN-002', eta: targetDate }
    ];

    vesselVisitNotificationClientMock.getAllVvns.mockResolvedValue(mockVvns);
    operationPlanRepoMock.findAll.mockResolvedValue([
      { id: 'plan-1', vvnCode: 'VVN-001' }
    ]);

    // Act
    const result = await operationPlanService.regenerateOperationPlansForDay(
      targetDate,
      algorithm,
      userId
    );

    // Assert
    expect(result.isSuccess).toBe(true);
    expect(operationPlanRepoMock.delete).toHaveBeenCalledWith('plan-1');
    expect(schedulingClientMock.generateOperationPlan).toHaveBeenCalledTimes(2);
  });
});
```

#### Repository Tests
Tests for the delete operation required for plan regeneration:

```ts
describe('OperationPlanRepo - Delete', () => {
  it('should delete an operation plan by ID', async () => {
    // Arrange
    const planId = 'plan-123';
    const mockPlan = {
      id: planId,
      vvnCode: 'VVN-001',
      remove: jest.fn().mockResolvedValue(true)
    };

    OperationPlanModel.findById.mockResolvedValue(mockPlan);

    // Act
    const result = await operationPlanRepo.delete(planId);

    // Assert
    expect(result).toBe(true);
    expect(mockPlan.remove).toHaveBeenCalled();
  });

  it('should return false when plan does not exist', async () => {
    // Arrange
    OperationPlanModel.findById.mockResolvedValue(null);

    // Act
    const result = await operationPlanRepo.delete('non-existent-id');

    // Assert
    expect(result).toBe(false);
  });
});
```

### Frontend Tests

#### Component Tests
Tests for the Operation Plan component's missing plans functionality:

```ts
describe('OperationPlanComponent - Missing Plans Tab', () => {
  it('should group VVNs by ETA date', () => {
    // Arrange
    const mockVvns = [
      { code: 'VVN-001', eta: '2026-01-15T10:00:00Z', vesselName: 'Vessel A' },
      { code: 'VVN-002', eta: '2026-01-15T14:00:00Z', vesselName: 'Vessel B' },
      { code: 'VVN-003', eta: '2026-01-16T09:00:00Z', vesselName: 'Vessel C' }
    ];

    component.missingVvns = mockVvns;

    // Act
    component.groupVvnsByDate();

    // Assert
    expect(component.groupedMissingVvns.size).toBe(2);
    expect(component.groupedMissingVvns.get('15/01/2026')).toHaveLength(2);
    expect(component.groupedMissingVvns.get('16/01/2026')).toHaveLength(1);
  });

  it('should auto-populate date when regenerating from date group', () => {
    // Arrange
    const targetDate = '15/01/2026';

    // Act
    component.regenerateForDate(targetDate);

    // Assert
    expect(component.showRegenerateModal).toBe(true);
    expect(component.regenerateDateString).toBe('2026-01-15');
    expect(component.regenerateAlgorithm).toBe('automatic');
  });

  it('should warn user before regenerating plans', () => {
    // Arrange
    component.regenerateDateString = '2026-01-15';
    component.regenerateAlgorithm = 'genetic';

    // Act
    const confirmSpy = spyOn(window, 'confirm').and.returnValue(true);
    component.confirmRegenerate();

    // Assert
    expect(confirmSpy).toHaveBeenCalled();
    expect(operationPlanServiceMock.regenerateOperationPlansForDay)
      .toHaveBeenCalledWith('2026-01-15', 'genetic');
  });
});
```

#### Service Tests
Tests for the frontend service methods:

```ts
describe('OperationPlanService - Missing Plans', () => {
  it('should fetch VVNs without operation plans', (done) => {
    // Arrange
    const mockResponse = [
      { code: 'VVN-001', vesselName: 'Vessel A', eta: '2026-01-15' }
    ];

    httpMock.expectOne('http://localhost:3000/api/operation-plans/missing')
      .flush(mockResponse);

    // Act
    service.getVvnsWithoutOperationPlan().subscribe(result => {
      // Assert
      expect(result).toEqual(mockResponse);
      done();
    });
  });

  it('should call regenerate endpoint with correct parameters', (done) => {
    // Arrange
    const date = '2026-01-15';
    const algorithm = 'improved';

    // Act
    service.regenerateOperationPlansForDay(date, algorithm).subscribe(() => {
      done();
    });

    // Assert
    const req = httpMock.expectOne('http://localhost:3000/api/operation-plans/regenerate');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ date, algorithm });
    req.flush({ success: true });
  });
});
```

### Integration Tests

#### API Integration Tests
End-to-end tests verifying the complete flow:

```ts
describe('Operation Plan Missing Plans Integration', () => {
  it('should return list of VVNs without operation plans', async () => {
    // Arrange: Create VVNs in test database
    await createTestVvn('VVN-001', '2026-01-15');
    await createTestVvn('VVN-002', '2026-01-15');
    
    // Create operation plan only for VVN-001
    await createTestOperationPlan('VVN-001');

    // Act
    const res = await request(app)
      .get('/api/operation-plans/missing')
      .expect(200);

    // Assert
    expect(res.body).toHaveLength(1);
    expect(res.body[0].code).toBe('VVN-002');
  });

  it('should regenerate all plans for a specific date', async () => {
    // Arrange
    const targetDate = '2026-01-15';
    await createTestVvn('VVN-001', targetDate);
    await createTestVvn('VVN-002', targetDate);
    await createTestOperationPlan('VVN-001'); // Existing plan to be deleted

    // Act
    const res = await request(app)
      .post('/api/operation-plans/regenerate')
      .send({ date: targetDate, algorithm: 'genetic' })
      .expect(200);

    // Assert
    expect(res.body.regenerated).toBe(2);
    
    // Verify old plan was deleted and new ones created
    const plans = await OperationPlanModel.find({ targetDay: targetDate });
    expect(plans).toHaveLength(2);
    plans.forEach(plan => {
      expect(plan.algorithm).toBe('genetic');
      expect(plan.createdAt).toBeDefined();
    });
  });
});
```