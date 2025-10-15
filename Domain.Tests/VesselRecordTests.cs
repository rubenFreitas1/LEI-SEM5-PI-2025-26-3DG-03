using System;
using System.Collections.Generic;
using Xunit;
using Domain.Model;



namespace Domain.Tests
{
    public class VesselRecordTest
    {
        private VesselType CreateVesselType(string name = "TypeA")
        {
            return new VesselType(name, "Desc", 100, 10, 5, 3);
        }

        [Theory]
        [InlineData("9241061", "VesselOne", "OperatorA")]
        [InlineData("9744001", "VesselTwo", "OperatorB")]

        public void Constructor_ValidParameters_ShouldCreateVesselRecord(string imoNumber, string vesselName, string operatorName)
        {
            var vesselType = CreateVesselType();
            var vesselRecord = new VesselRecord(imoNumber, vesselName, vesselType, operatorName);
            Assert.Equal(imoNumber, vesselRecord.IMONumber);
            Assert.Equal(vesselName, vesselRecord.VesselName);
            Assert.Equal(vesselType, vesselRecord.VesselType);
            Assert.Equal(operatorName, vesselRecord.Operator);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void Constructor_InvalidVesselName_ShouldThrow(string vesselName)
        {
            var vesselType = CreateVesselType();
            Assert.Throws<ArgumentException>(() => new VesselRecord("1234567", vesselName, vesselType, "OperatorA"));
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void Constructor_InvalidOperator_ShouldThrow(string operatorName)
        {
            var vesselType = CreateVesselType();
            Assert.Throws<ArgumentException>(() => new VesselRecord("1234567", "VesselOne", vesselType, operatorName));
        }

        [Theory]
        [InlineData(null)]
        public void Constructor_NullVesselType_ShouldThrow(VesselType vesselType)
        {
            Assert.Throws<ArgumentNullException>(() => new VesselRecord("1234567", "VesselOne", vesselType!, "OperatorA"));
        }

        [Theory]
        [InlineData("123456")]
        [InlineData("12345678")]
        [InlineData("ABCDEFG")]
        public void Constructor_InvalidIMONumber_ShouldThrow(string imoNumber)
        {
            var vesselType = CreateVesselType();
            Assert.Throws<ArgumentOutOfRangeException>(() => new VesselRecord(imoNumber, "VesselOne", vesselType, "OperatorA"));
        }

        [Theory]
        [InlineData("NewVesselName")]
        public void ChangeVesselName_ValidName_ShouldUpdate(string newVesselName)
        {
            var vesselType = CreateVesselType();
            var vesselRecord = new VesselRecord("1234567", "VesselOne", vesselType, "OperatorA");
            vesselRecord.ChangeVesselName(newVesselName);
            Assert.Equal(newVesselName, vesselRecord.VesselName);
        }
        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void ChangeVesselName_InvalidName_ShouldThrow(string newVesselName)
        {
            var vesselType = CreateVesselType();
            var vesselRecord = new VesselRecord("1234567", "VesselOne", vesselType, "OperatorA");
            Assert.Throws<ArgumentException>(() => vesselRecord.ChangeVesselName(newVesselName));
        }

        [Fact]
        public void ChangeVesselType_ValidType_ShouldUpdate()
        {
            var vesselType1 = CreateVesselType("TypeA");
            var vesselType2 = CreateVesselType("TypeB");
            var vesselRecord = new VesselRecord("1234567", "VesselOne", vesselType1, "OperatorA");
            vesselRecord.ChangeVesselType(vesselType2);
            Assert.Equal(vesselType2, vesselRecord.VesselType);
        }

        [Fact]
        public void ChangeVesselType_NullType_ShouldThrow()
        {
            var vesselType = CreateVesselType();
            var vesselRecord = new VesselRecord("1234567", "VesselOne", vesselType, "OperatorA");
            Assert.Throws<ArgumentNullException>(() => vesselRecord.ChangeVesselType(null!));
        }

        [Theory]
        [InlineData("NewOperator")]
        public void ChangeOperator_ValidOperator_ShouldUpdate(string newOperator)
        {
            var vesselType = CreateVesselType();
            var vesselRecord = new VesselRecord("1234567", "VesselOne", vesselType, "OperatorA");
            vesselRecord.ChangeOperator(newOperator);
            Assert.Equal(newOperator, vesselRecord.Operator);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void ChangeOperator_InvalidOperator_ShouldThrow(string newOperator)
        {
            var vesselType = CreateVesselType();
            var vesselRecord = new VesselRecord("1234567", "VesselOne", vesselType, "OperatorA");
            Assert.Throws<ArgumentException>(() => vesselRecord.ChangeOperator(newOperator));
        }

    }
}