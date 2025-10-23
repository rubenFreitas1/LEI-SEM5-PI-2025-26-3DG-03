# US 2.2.7

## 1. Context

*Vessel Visit Notifications are the formal requests submitted by shipping agent representatives to announce and schedule a vessel’s arrival at the port. Reviewing these notifications is a critical responsibility of the Port Authority Officer, ensuring that docking operations are managed efficiently and securely. By approving or rejecting notifications, officers maintain control over berthing schedules, prevent conflicts in dock allocation, and guarantee that only properly documented vessels gain access.*

## 2. Requirements

**US 2.2.7** As a Port Authority Officer, I want to review pending Vessel Visit Notifications and approve or reject them, so that docking schedules remain under port control.


**Acceptance Criteria:**

- When a notification is approved, the officer must assign a (temporarily) dock on which the vessel should berth.

- When a notification is rejected, the officer must provide a reason for rejection (e.g., information is missing).

- If rejected, the shipping agent representative might review / update the notification for further new decision.

- All decisions (approve/reject) must be logged with timestamp, officer ID, and decision outcome for auditing purposes.

**Dependencies/References:**

*There is a dependency with US2.2.8, since a vessel visit notification must exist so it can be reviewed in this us.*
*There is a dependency with US2.2.3, since a dock must exist so it can be assigned if the visit notification is accepted.*

**Forum Insight:**

>>Knowing that a Vessel Visit Notification (VVN) can be modified after being rejected (and this may happen multiple times for the same VVN), is it necessary for the system to store the information of the VVN for each update stage it goes through?\
I am not referring to the log with timestamp, officer ID, and decision outcome for auditing purposes, but rather to the VVN’s actual information, so that in the case of historical review, one can know the VVN’s details at each of its stages.
>
>It would be a nice feature.\
I'll only consider it later, as a system improvement.

## 3. Analysis

Review and Approved 

![System Sequence Diagram ](images/system-sequence-diagram-US2.2.7-approved.png)

Review and Rejected

![System Sequence Diagram ](images/system-sequence-diagram-US2.2.7-rejected.png)


## 4. C4 Model

#### Context - Level 1

#### Containers - Level 2

#### Components - Level 3

#### Code - Level 4

#### Level +1


## 5. Integration Tests

### Tests Related To Post

```csharp
        [Fact]
        public async Task PostDecision_InvalidStatus_ReturnsBadRequest()
        {
            var listResp = await _client.GetAsync("/api/VesselVisitNotification");
            listResp.EnsureSuccessStatusCode();
            var visits = await listResp.Content.ReadFromJsonAsync<IEnumerable<VesselVisitNotificationDTO>>();
            var visitCode = visits!.First().Code;

            var dto = new DecisionDTO(0, "NotAStatus", "Whatever", 1, visitCode);

            var response = await _client.PostAsJsonAsync("/api/VesselVisitNotification/Decision", dto);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var errors = await response.Content.ReadFromJsonAsync<List<string>>();
            Assert.Contains(errors!, s => s.Contains("Invalid Decision Status"));
        }

        [Fact]
        public async Task PostDecision_ApprovedWithNonExistingDock_ReturnsBadRequest()
        {
            var getList = await _client.GetAsync("/api/VesselVisitNotification");
            getList.EnsureSuccessStatusCode();
            var visitDtos = await getList.Content.ReadFromJsonAsync<List<VesselVisitNotificationDTO>>();
            var visitCode = visitDtos!.First().Code;

            var getByCode = await _client.GetAsync($"/api/VesselVisitNotification/ByCode/{visitCode}");
            getByCode.EnsureSuccessStatusCode();
            var visit = await getByCode.Content.ReadFromJsonAsync<VesselVisitNotificationDTO>();
            visit!.VisitStatus = VisitStatus.Submitted;
            var putResp = await _client.PutAsJsonAsync($"/api/VesselVisitNotification/Update/{visitCode}", visit);

            var dto = new DecisionDTO(0, "Approved", "NonExistingDock", 1, visitCode);

            var response = await _client.PostAsJsonAsync("/api/VesselVisitNotification/Decision", dto);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            var errors = await response.Content.ReadFromJsonAsync<List<string>>();
            Assert.Contains(errors!, s => s.Contains("Dock with name"));
        }

        [Fact]
        public async Task PostDecision_ApprovedWithExistingDock_ReturnsCreatedAndCorrectResponse()
        {
            var getList = await _client.GetAsync("/api/VesselVisitNotification");
            getList.EnsureSuccessStatusCode();
            var visitDtos = await getList.Content.ReadFromJsonAsync<List<VesselVisitNotificationDTO>>();
            var visitCode = visitDtos!.First().Code;

            var getByCode = await _client.GetAsync($"/api/VesselVisitNotification/ByCode/{visitCode}");
            getByCode.EnsureSuccessStatusCode();
            var visit = await getByCode.Content.ReadFromJsonAsync<VesselVisitNotificationDTO>();
            visit!.VisitStatus = VisitStatus.Submitted;
            await _client.PutAsJsonAsync($"/api/VesselVisitNotification/Update/{visitCode}", visit);

            var dto = new DecisionDTO(0, "Approved", "Dock A", 0, visitCode);

            var response = await _client.PostAsJsonAsync("/api/VesselVisitNotification/Decision", dto);

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            var created = await response.Content.ReadFromJsonAsync<DecisionDTO>();
            Assert.NotNull(created);
            Assert.Equal("Dock A", created!.ResponseMessage);
            Assert.Equal("Approved", created.Status);
        }

        
```