using System;
using System.Collections.Generic;
using Xunit;
using Domain.Model;

namespace Domain.Tests
{
    public class CargoManifestEntryTests
    {

        private List<CrewMember> CreateValidCrew() =>
            new List<CrewMember>
            {
                new CrewMember("Captain A", "C001", CrewRank.Captain, "PT"),
                new CrewMember("Safety Officer B", "S002", CrewRank.SafetyOfficer, "PT"),
                new CrewMember("Officer C", "O003", CrewRank.Officer, "PT")
            };
        private Container CreateValidContainer() => new Container("ABCU1234567");

        private StorageArea CreateValidStorageArea() =>
            new StorageArea("SA01", "Location1", StorageAreaType.Warehouse, 100, 0);

        private VesselVisitNotification CreateValidVesselVisitNotification()
        {
            return new VesselVisitNotification(
                "2025-PA-000001",
                new VesselRecord("9781889", "test", createValidVesselType(), "test"),
                new Representative(CreateValidShippingAgentOrganization(), "Joao", "AA1111", "PT", "teste@gmail.com", "999999999"),    // mínimo necessário
                DateTime.UtcNow,
                DateTime.UtcNow.AddHours(2),
                new List<CargoManifest>(),
                CargoType.Container,
                1000,
                CreateValidCrew(),
                10,
                new List<DockReassignmentLog>()
            );
        }

        private ShippingAgentOrganization CreateValidShippingAgentOrganization() =>
            new ShippingAgentOrganization("AAA", "AAAAAAA", "AAAAAA", "AAAAAA", "A13231");

        private VesselType createValidVesselType() => new VesselType("Type1", "Description1", 4, 4, 4, 4);

        private CargoManifest CreateValidCargoManifest(List<CargoManifestEntry>? entries = null)
        {
            var vesselVisit = CreateValidVesselVisitNotification();
            return new CargoManifest(CargoManifestType.Loading, entries ?? new List<CargoManifestEntry>(), vesselVisit);
        }

        [Fact]
        public void Constructor_ValidParameters_ShouldCreateEntry()
        {
            var container = CreateValidContainer();
            var storageArea = CreateValidStorageArea();
            var manifest = CreateValidCargoManifest();

            var entry = new CargoManifestEntry(container, 1, 1, 1, storageArea, manifest);

            Assert.Equal(container, entry.Container);
            Assert.Equal(1, entry.Row);
            Assert.Equal(1, entry.Bay);
            Assert.Equal(1, entry.Tier);
            Assert.Equal(storageArea, entry.StorageArea);
            Assert.Equal(manifest, entry.CargoManifest);
            Assert.Equal(manifest.Id, entry.CargoManifestId);
        }

        [Fact]
        public void Constructor_NullContainer_ShouldThrow()
        {
            var storageArea = CreateValidStorageArea();
            var manifest = CreateValidCargoManifest();

            Assert.Throws<ArgumentException>(() => new CargoManifestEntry(null!, 1, 1, 1, storageArea, manifest));
        }

        [Fact]
        public void Constructor_NullStorageArea_ShouldThrow()
        {
            var container = CreateValidContainer();
            var manifest = CreateValidCargoManifest();

            Assert.Throws<ArgumentException>(() => new CargoManifestEntry(container, 1, 1, 1, null!, manifest));
        }

        [Fact]
        public void Constructor_NullCargoManifest_ShouldThrow()
        {
            var container = CreateValidContainer();
            var storageArea = CreateValidStorageArea();

            Assert.Throws<ArgumentException>(() => new CargoManifestEntry(container, 1, 1, 1, storageArea, null!));
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        public void Constructor_InvalidRow_ShouldThrow(int invalidRow)
        {
            var container = CreateValidContainer();
            var storageArea = CreateValidStorageArea();
            var manifest = CreateValidCargoManifest();

            Assert.Throws<ArgumentException>(() => new CargoManifestEntry(container, invalidRow, 1, 1, storageArea, manifest));
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-5)]
        public void Constructor_InvalidBay_ShouldThrow(int invalidBay)
        {
            var container = CreateValidContainer();
            var storageArea = CreateValidStorageArea();
            var manifest = CreateValidCargoManifest();

            Assert.Throws<ArgumentException>(() => new CargoManifestEntry(container, 1, invalidBay, 1, storageArea, manifest));
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-10)]
        public void Constructor_InvalidTier_ShouldThrow(int invalidTier)
        {
            var container = CreateValidContainer();
            var storageArea = CreateValidStorageArea();
            var manifest = CreateValidCargoManifest();

            Assert.Throws<ArgumentException>(() => new CargoManifestEntry(container, 1, 1, invalidTier, storageArea, manifest));
        }

        [Fact]
        public void Constructor_AllInvalidParameters_ShouldThrow()
        {
            Assert.Throws<ArgumentException>(() =>
                new CargoManifestEntry(null!, 0, -1, -2, null!, null!)
            );
        }
    }
}
