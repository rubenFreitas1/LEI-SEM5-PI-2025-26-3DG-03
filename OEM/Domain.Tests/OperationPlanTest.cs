using Domain.Model;
using Xunit;


namespace Domain.Tests
{
    public class OperationPlanTests
    {
        [Fact]
        public void Constructor_ValidParameters_ShouldCreateOperationPlan()
        {
            var vesselName = "Vessel A";
            var vesselName2 = "Vessel B";
            var arrivalTime = DateTime.UtcNow;
            var departureTime = arrivalTime.AddHours(5);
            var cranes = new List<string> { "Crane1", "Crane2" };
            var staffMembers = new List<string> { "Staff1", "Staff2" };
            var OperationList = new List<OperationEntry>
            {
                new OperationEntry(vesselName, arrivalTime, departureTime, cranes, staffMembers),
                new OperationEntry(vesselName2, arrivalTime.AddHours(6), departureTime.AddHours(6), cranes, staffMembers)
            };

            var targetDay = DateTime.UtcNow.Date;
            var author = "Author1";
            var algorithm = "Algorithm1";
            var createdAt = DateTime.UtcNow;

            var operationPlan = new OperationPlan(OperationList, targetDay, author, algorithm, createdAt);

            Assert.Equal(OperationList, operationPlan.OperationList);
            Assert.Equal(targetDay, operationPlan.TargetDay);
            Assert.Equal(author, operationPlan.Author);
            Assert.Equal(algorithm, operationPlan.Algorithm);
            Assert.Equal(createdAt, operationPlan.CreatedAt);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void Constructor_InvalidAuthor_ShouldThrow(string invalidAuthor)
        {
            var vesselName = "Vessel A";
            var arrivalTime = DateTime.UtcNow;
            var departureTime = arrivalTime.AddHours(5);
            var cranes = new List<string> { "Crane1", "Crane2" };
            var staffMembers = new List<string> { "Staff1", "Staff2" };
            var OperationList = new List<OperationEntry>
            {
                new OperationEntry(vesselName, arrivalTime, departureTime, cranes, staffMembers)
            };

            var targetDay = DateTime.UtcNow.Date;
            var algorithm = "Algorithm1";
            var createdAt = DateTime.UtcNow;

            var ex = Assert.Throws<ArgumentException>(() => new OperationPlan(OperationList, targetDay, invalidAuthor, algorithm, createdAt));
            Assert.Equal("author", ex.ParamName);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void Constructor_InvalidAlgorithm_ShouldThrow(string invalidAlgorithm)
        {
            var vesselName = "Vessel A";
            var arrivalTime = DateTime.UtcNow;
            var departureTime = arrivalTime.AddHours(5);
            var cranes = new List<string> { "Crane1", "Crane2" };
            var staffMembers = new List<string> { "Staff1", "Staff2" };
            var OperationList = new List<OperationEntry>
            {
                new OperationEntry(vesselName, arrivalTime, departureTime, cranes, staffMembers)
            };

            var targetDay = DateTime.UtcNow.Date;
            var author = "Author1";
            var createdAt = DateTime.UtcNow;

            var ex = Assert.Throws<ArgumentException>(() => new OperationPlan(OperationList, targetDay, author, invalidAlgorithm, createdAt));
            Assert.Equal("algorithm", ex.ParamName);
        }

        [Theory]
        [InlineData(null)]
        public void Constructor_InvalidOperationList_ShouldThrow(List<OperationEntry> invalidList)
        {
            var targetDay = DateTime.UtcNow.Date;
            var author = "Author1";
            var algorithm = "Algorithm1";
            var createdAt = DateTime.UtcNow;
            var ex = Assert.Throws<ArgumentException>(() => new OperationPlan(invalidList, targetDay, author, algorithm, createdAt));
            Assert.Equal("list", ex.ParamName);
        }

        [Fact]
        public void UpdateAlgorithm_Valid_ShouldUpdate()
        {
            var vesselName = "Vessel A";
            var arrivalTime = DateTime.UtcNow;
            var departureTime = arrivalTime.AddHours(5);
            var cranes = new List<string> { "Crane1", "Crane2" };
            var staffMembers = new List<string> { "Staff1", "Staff2" };
            var OperationList = new List<OperationEntry>
            {
                new OperationEntry(vesselName, arrivalTime, departureTime, cranes, staffMembers)
            };

            var targetDay = DateTime.UtcNow.Date;
            var author = "Author1";
            var algorithm = "Algorithm1";
            var createdAt = DateTime.UtcNow;

            var operationPlan = new OperationPlan(OperationList, targetDay, author, algorithm, createdAt);
            var newAlgorithm = "Algorithm2";
            operationPlan.ChangeAlgorithm(newAlgorithm);

            Assert.Equal(newAlgorithm, operationPlan.Algorithm);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void UpdateAlgorithm_Invalid_ShouldThrow(string invalidAlgorithm)
        {
            var vesselName = "Vessel A";
            var arrivalTime = DateTime.UtcNow;
            var departureTime = arrivalTime.AddHours(5);
            var cranes = new List<string> { "Crane1", "Crane2" };
            var staffMembers = new List<string> { "Staff1", "Staff2" };
            var OperationList = new List<OperationEntry>
            {
                new OperationEntry(vesselName, arrivalTime, departureTime, cranes, staffMembers)
            };

            var targetDay = DateTime.UtcNow.Date;
            var author = "Author1";
            var algorithm = "Algorithm1";
            var createdAt = DateTime.UtcNow;

            var operationPlan = new OperationPlan(OperationList, targetDay, author, algorithm, createdAt);
            var ex = Assert.Throws<ArgumentException>(() => operationPlan.ChangeAlgorithm(invalidAlgorithm));
            Assert.Equal("newAlgorithm", ex.ParamName);
        }

        [Fact]
        public void UpdateAuthor_Valid_ShouldUpdate()
        {
            var vesselName = "Vessel A";
            var arrivalTime = DateTime.UtcNow;
            var departureTime = arrivalTime.AddHours(5);
            var cranes = new List<string> { "Crane1", "Crane2" };
            var staffMembers = new List<string> { "Staff1", "Staff2" };
            var OperationList = new List<OperationEntry>
            {
                new OperationEntry(vesselName, arrivalTime, departureTime, cranes, staffMembers)
            };

            var targetDay = DateTime.UtcNow.Date;
            var author = "Author1";
            var algorithm = "Algorithm1";
            var createdAt = DateTime.UtcNow;

            var operationPlan = new OperationPlan(OperationList, targetDay, author, algorithm, createdAt);
            var newAuthor = "Author2";
            operationPlan.ChangeAuthor(newAuthor);

            Assert.Equal(newAuthor, operationPlan.Author);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void UpdateAuthor_Invalid_ShouldThrow(string invalidAuthor)
        {
            var vesselName = "Vessel A";
            var arrivalTime = DateTime.UtcNow;
            var departureTime = arrivalTime.AddHours(5);
            var cranes = new List<string> { "Crane1", "Crane2" };
            var staffMembers = new List<string> { "Staff1", "Staff2" };
            var OperationList = new List<OperationEntry>
            {
                new OperationEntry(vesselName, arrivalTime, departureTime, cranes, staffMembers)
            };

            var targetDay = DateTime.UtcNow.Date;
            var author = "Author1";
            var algorithm = "Algorithm1";
            var createdAt = DateTime.UtcNow;

            var operationPlan = new OperationPlan(OperationList, targetDay, author, algorithm, createdAt);
            var ex = Assert.Throws<ArgumentException>(() => operationPlan.ChangeAuthor(invalidAuthor));
            Assert.Equal("newAuthor", ex.ParamName);
        }

        [Fact]
        public void UpdateOperationList_Valid_ShouldUpdate()
        {
            var vesselName = "Vessel A";
            var arrivalTime = DateTime.UtcNow;
            var departureTime = arrivalTime.AddHours(5);
            var cranes = new List<string> { "Crane1", "Crane2" };
            var staffMembers = new List<string> { "Staff1", "Staff2" };
            var OperationList = new List<OperationEntry>
            {
                new OperationEntry(vesselName, arrivalTime, departureTime, cranes, staffMembers)
            };

            var targetDay = DateTime.UtcNow.Date;
            var author = "Author1";
            var algorithm = "Algorithm1";
            var createdAt = DateTime.UtcNow;

            var operationPlan = new OperationPlan(OperationList, targetDay, author, algorithm, createdAt);

            var newOperationList = new List<OperationEntry>
            {
                new OperationEntry("Vessel B", arrivalTime.AddHours(6), departureTime.AddHours(6), cranes, staffMembers)
            };

            operationPlan.ChangeOperationList(newOperationList);

            Assert.Equal(newOperationList, operationPlan.OperationList);
        }

        [Theory]
        [InlineData(null)]
        public void UpdateOperationList_Invalid_ShouldThrow(List<OperationEntry> invalidList)
        {
            var vesselName = "Vessel A";
            var arrivalTime = DateTime.UtcNow;
            var departureTime = arrivalTime.AddHours(5);
            var cranes = new List<string> { "Crane1", "Crane2" };
            var staffMembers = new List<string> { "Staff1", "Staff2" };
            var OperationList = new List<OperationEntry>
            {
                new OperationEntry(vesselName, arrivalTime, departureTime, cranes, staffMembers)
            };

            var targetDay = DateTime.UtcNow.Date;
            var author = "Author1";
            var algorithm = "Algorithm1";
            var createdAt = DateTime.UtcNow;

            var operationPlan = new OperationPlan(OperationList, targetDay, author, algorithm, createdAt);
            var ex = Assert.Throws<ArgumentException>(() => operationPlan.ChangeOperationList(invalidList));
            Assert.Equal("newList", ex.ParamName);
        }
    

        [Fact]
        public void UpdateTargetDay_Valid_ShouldUpdate()
        {
            var vesselName = "Vessel A";
            var arrivalTime = DateTime.UtcNow;
            var departureTime = arrivalTime.AddHours(5);
            var cranes = new List<string> { "Crane1", "Crane2" };
            var staffMembers = new List<string> { "Staff1", "Staff2" };
            var OperationList = new List<OperationEntry>
            {
                new OperationEntry(vesselName, arrivalTime, departureTime, cranes, staffMembers)
            };

            var targetDay = DateTime.UtcNow.Date;
            var author = "Author1";
            var algorithm = "Algorithm1";
            var createdAt = DateTime.UtcNow;

            var operationPlan = new OperationPlan(OperationList, targetDay, author, algorithm, createdAt);
            var newTargetDay = targetDay.AddDays(1);
            operationPlan.ChangeTargetDay(newTargetDay);

            Assert.Equal(newTargetDay, operationPlan.TargetDay);
        }

        [Theory]
        [InlineData(null)]
        public void UpdateTargetDay_Invalid_ShouldThrow(DateTime? invalidTargetDay)
        {
            var vesselName = "Vessel A";
            var arrivalTime = DateTime.UtcNow;
            var departureTime = arrivalTime.AddHours(5);
            var cranes = new List<string> { "Crane1", "Crane2" };
            var staffMembers = new List<string> { "Staff1", "Staff2" };
            var OperationList = new List<OperationEntry>
            {
                new OperationEntry(vesselName, arrivalTime, departureTime, cranes, staffMembers)
            };

            var targetDay = DateTime.UtcNow.Date;
            var author = "Author1";
            var algorithm = "Algorithm1";
            var createdAt = DateTime.UtcNow;

            var operationPlan = new OperationPlan(OperationList, targetDay, author, algorithm, createdAt);
            if (invalidTargetDay == null)
            {
                Assert.Throws<ArgumentException>(() => operationPlan.ChangeTargetDay(invalidTargetDay));
            }
        }
    }

}