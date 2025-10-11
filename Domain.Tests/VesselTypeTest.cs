using System;
using Xunit;
using Domain.Model;
using System.Runtime.InteropServices;

namespace Domain.Tests
{
    public class VesselTypeTest
    {
        [Theory]
        [InlineData("a", "a", 100, 10, 5, 3)]
        [InlineData("Container", "Large container ship", 2000, 50, 20, 10)]
        [InlineData("BulkCarrier", "Carries bulk goods", 1500, 30, 15, 8)]
        public void Constructor_ValidParameters_ShouldCreateObject(string name, string desc, int capacity, int maxRows, int maxBays, int maxTiers)
        {
            var vesselType = new VesselType(name, desc, capacity, maxRows, maxBays, maxTiers);
            Assert.Equal(name, vesselType.Name);
            Assert.Equal(desc, vesselType.Description);
            Assert.Equal(capacity, vesselType.Capacity);
            Assert.Equal(maxRows, vesselType.MaxRows);
            Assert.Equal(maxBays, vesselType.MaxBays);
            Assert.Equal(maxTiers, vesselType.MaxTiers);
        }


        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void Constructor_InvalidName_ShouldThrow(string name)
        {
            Assert.Throws<ArgumentException>(() => new VesselType(name, "Desc", 100, 10, 5, 3));
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void Constructor_InvalidDescription_ShouldThrow(string desc)
        {
            Assert.Throws<ArgumentException>(() => new VesselType("TypeA", desc, 100, 10, 5, 3));
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        public void Constructor_InvalidCapacity_ShouldThrow(int capacity)
        {
            Assert.Throws<ArgumentOutOfRangeException>(() => new VesselType("TypeA", "Desc", capacity, 10, 5, 3));
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        public void Constructor_InvalidMaxRows_ShouldThrow(int maxRows)
        {
            Assert.Throws<ArgumentOutOfRangeException>(() => new VesselType("TypeA", "Desc", 100, maxRows, 5, 3));
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        public void Constructor_InvalidMaxBays_ShouldThrow(int maxBays)
        {
            Assert.Throws<ArgumentOutOfRangeException>(() => new VesselType("TypeA", "Desc", 100, 10, maxBays, 3));
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        public void Constructor_InvalidMaxTiers_ShouldThrow(int maxTiers)
        {
            Assert.Throws<ArgumentOutOfRangeException>(() => new VesselType("TypeA", "Desc", 100, 10, 5, maxTiers));
        }

        [Fact]
        public void ChangeMethods_ValidValues_ShouldUpdateProperties()
        {
            var vesselType = new VesselType("TypeA", "Desc", 100, 10, 5, 3);
            vesselType.ChangeName("TypeB");
            vesselType.ChangeDescription("Desc2");
            vesselType.ChangeCapacity(200);
            vesselType.ChangeMaxRows(20);
            vesselType.ChangeMaxBays(10);
            vesselType.ChangeMaxTiers(6);
            Assert.Equal("TypeB", vesselType.Name);
            Assert.Equal("Desc2", vesselType.Description);
            Assert.Equal(200, vesselType.Capacity);
            Assert.Equal(20, vesselType.MaxRows);
            Assert.Equal(10, vesselType.MaxBays);
            Assert.Equal(6, vesselType.MaxTiers);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void ChangeName_Invalid_ShouldThrow(string name)
        {
            var vesselType = new VesselType("TypeA", "Desc", 100, 10, 5, 3);
            Assert.Throws<ArgumentException>(() => vesselType.ChangeName(name));
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void ChangeDescription_Invalid_ShouldThrow(string desc)
        {
            var vesselType = new VesselType("TypeA", "Desc", 100, 10, 5, 3);
            Assert.Throws<ArgumentException>(() => vesselType.ChangeDescription(desc));
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        public void ChangeCapacity_Invalid_ShouldThrow(int capacity)
        {
            var vesselType = new VesselType("TypeA", "Desc", 100, 10, 5, 3);
            Assert.Throws<ArgumentException>(() => vesselType.ChangeCapacity(capacity));
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        public void ChangeMaxRows_Invalid_ShouldThrow(int rows)
        {
            var vesselType = new VesselType("TypeA", "Desc", 100, 10, 5, 3);
            Assert.Throws<ArgumentException>(() => vesselType.ChangeMaxRows(rows));
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        public void ChangeMaxBays_Invalid_ShouldThrow(int bays)
        {
            var vesselType = new VesselType("TypeA", "Desc", 100, 10, 5, 3);
            Assert.Throws<ArgumentException>(() => vesselType.ChangeMaxBays(bays));
        }

        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        public void ChangeMaxTiers_Invalid_ShouldThrow(int tiers)
        {
            var vesselType = new VesselType("TypeA", "Desc", 100, 10, 5, 3);
            Assert.Throws<ArgumentException>(() => vesselType.ChangeMaxTiers(tiers));
        }
    }
}