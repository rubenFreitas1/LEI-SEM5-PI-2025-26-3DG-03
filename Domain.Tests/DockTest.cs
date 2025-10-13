using System;
using System.Collections.Generic;
using Xunit;
using Domain.Model;

namespace Domain.Tests
{
    public class DockTest
    {
        private VesselType CreateVesselType(string name = "TypeA")
        {
            return new VesselType(name, "Desc", 100, 10, 5, 3);
        }

        [Theory]
        [InlineData("Dock1", "Location1", 200, 20, 10)]
        [InlineData("Main Dock", "Harbor", 500, 30, 15)]
        [InlineData("Secondary Dock", "Second Harbor", 300, 25, 12)]
        public void Constructor_ValidParameters_ShouldCreateDock(string name, string location, int length, int depth, int maxDraft)
        {
            var vesselTypes = new List<VesselType> { CreateVesselType() };
            var dock = new Dock(name, location, length, depth, maxDraft, vesselTypes);
            Assert.Equal(name, dock.Name);
            Assert.Equal(location, dock.Location);
            Assert.Equal(length, dock.Length);
            Assert.Equal(depth, dock.Depth);
            Assert.Equal(maxDraft, dock.MaxDraft);
            Assert.Equal(vesselTypes, dock.VesselTypesAllowed);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void Constructor_InvalidName_ShouldThrow(string name)
        {
            var vesselTypes = new List<VesselType> { CreateVesselType() };
            Assert.Throws<ArgumentException>(() => new Dock(name, "Location1", 200, 20, 10, vesselTypes));
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void Constructor_InvalidLocation_ShouldThrow(string location)
        {
            var vesselTypes = new List<VesselType> { CreateVesselType() };
            Assert.Throws<ArgumentException>(() => new Dock("Dock1", location, 200, 20, 10, vesselTypes));
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        public void Constructor_InvalidLength_ShouldThrow(int length)
        {
            var vesselTypes = new List<VesselType> { CreateVesselType() };
            Assert.Throws<ArgumentOutOfRangeException>(() => new Dock("Dock1", "Location1", length, 20, 10, vesselTypes));
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        public void Constructor_InvalidDepth_ShouldThrow(int depth)
        {
            var vesselTypes = new List<VesselType> { CreateVesselType() };
            Assert.Throws<ArgumentOutOfRangeException>(() => new Dock("Dock1", "Location1", 200, depth, 10, vesselTypes));
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        public void Constructor_InvalidMaxDraft_ShouldThrow(int maxDraft)
        {
            var vesselTypes = new List<VesselType> { CreateVesselType() };
            Assert.Throws<ArgumentOutOfRangeException>(() => new Dock("Dock1", "Location1", 200, 20, maxDraft, vesselTypes));
        }

        [Theory]
        [InlineData(null)]
        public void Constructor_NullVesselTypes_ShouldThrow(List<VesselType> vesselTypes)
        {
            Assert.Throws<ArgumentNullException>(() => new Dock("Dock1", "Location1", 200, 20, 10, vesselTypes));
        }

        [Fact]
        public void AddVesselType_ValidAndNotExists_ShouldAdd()
        {
            var vesselTypes = new List<VesselType> { CreateVesselType("TypeA") };
            var dock = new Dock("Dock1", "Location1", 200, 20, 10, vesselTypes);
            var newVesselType = CreateVesselType("TypeB");
            var result = dock.AddVesselType(newVesselType);
            Assert.True(result);
            Assert.Contains(newVesselType, dock.VesselTypesAllowed!);
        }

        [Fact]
        public void AddVesselType_AlreadyExists_ShouldNotAdd()
        {
            var vesselType = CreateVesselType("TypeA");
            var vesselTypes = new List<VesselType> { vesselType };
            var dock = new Dock("Dock1", "Location1", 200, 20, 10, vesselTypes);
            var result = dock.AddVesselType(vesselType);
            Assert.False(result);
        }

        [Theory]
        [InlineData(null)]
        public void AddVesselType_Null_ShouldNotAdd(VesselType vesselType)
        {
            var vesselTypes1 = new List<VesselType> { CreateVesselType("TypeA") };
            var dock = new Dock("Dock1", "Location1", 200, 20, 10, vesselTypes1);
            var result = dock.AddVesselType(vesselType);
            Assert.False(result);
        }

        [Fact]
        public void ChangeMethods_ValidValues_ShouldUpdatePropertiesAndSetLastModifiedAt()
        {
            var vesselTypes = new List<VesselType> { CreateVesselType("TypeA") };
            var dock = new Dock("Dock1", "Location1", 200, 20, 10, vesselTypes);
            dock.ChangeName("Dock2");
            dock.ChangeLocation("Location2");
            dock.ChangeLength(300);
            dock.ChangeDepth(40);
            dock.ChangeMaxDraft(20);
            var newVesselTypes = new List<VesselType> { CreateVesselType("TypeB") };
            dock.ChangeVesselTypesAllowed(newVesselTypes);
            Assert.Equal("Dock2", dock.Name);
            Assert.Equal("Location2", dock.Location);
            Assert.Equal(300, dock.Length);
            Assert.Equal(40, dock.Depth);
            Assert.Equal(20, dock.MaxDraft);
            Assert.Equal(newVesselTypes, dock.VesselTypesAllowed);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void ChangeName_Invalid_ShouldThrow(string name)
        {
            var vesselTypes = new List<VesselType> { CreateVesselType("TypeA") };
            var dock = new Dock("Dock1", "Location1", 200, 20, 10, vesselTypes);
            Assert.Throws<ArgumentException>(() => dock.ChangeName(name));
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void ChangeLocation_Invalid_ShouldThrow(string location)
        {
            var vesselTypes = new List<VesselType> { CreateVesselType("TypeA") };
            var dock = new Dock("Dock1", "Location1", 200, 20, 10, vesselTypes);
            Assert.Throws<ArgumentException>(() => dock.ChangeLocation(location));
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        public void ChangeLength_Invalid_ShouldThrow(int length)
        {
            var vesselTypes = new List<VesselType> { CreateVesselType("TypeA") };
            var dock = new Dock("Dock1", "Location1", 200, 20, 10, vesselTypes);
            Assert.Throws<ArgumentOutOfRangeException>(() => dock.ChangeLength(length));
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        public void ChangeDepth_Invalid_ShouldThrow(int depth)
        {
            var vesselTypes = new List<VesselType> { CreateVesselType("TypeA") };
            var dock = new Dock("Dock1", "Location1", 200, 20, 10, vesselTypes);
            Assert.Throws<ArgumentOutOfRangeException>(() => dock.ChangeDepth(depth));
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        public void ChangeMaxDraft_Invalid_ShouldThrow(int maxDraft)
        {
            var vesselTypes = new List<VesselType> { CreateVesselType("TypeA") };
            var dock = new Dock("Dock1", "Location1", 200, 20, 10, vesselTypes);
            Assert.Throws<ArgumentOutOfRangeException>(() => dock.ChangeMaxDraft(maxDraft));
        }

        [Theory]
        [InlineData(null)]
        public void ChangeVesselTypesAllowed_Null_ShouldThrow(List<VesselType> vesselTypes)
        {
            var vesselTypes1 = new List<VesselType> { CreateVesselType("TypeA") };
            var dock = new Dock("Dock1", "Location1", 200, 20, 10, vesselTypes1);
            Assert.Throws<ArgumentNullException>(() => dock.ChangeVesselTypesAllowed(vesselTypes));
        }
    }
}
