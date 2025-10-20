using System;
using Xunit;
using Domain.Model;

namespace Domain.Tests
{
    public class CrewMemberTest
    {
        [Fact]
        public void Constructor_ValidParameters_ShouldCreateCrewMember()
        {
            var crew = new CrewMember("Joao Silva", "AA123456", CrewRank.Captain, "PT");

            Assert.Equal("Joao Silva", crew.Name);
            Assert.Equal("AA123456", crew.CitizenId);
            Assert.Equal(CrewRank.Captain, crew.Rank);
            Assert.Equal("PT", crew.Nationality);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void Constructor_InvalidName_ShouldThrow(string invalidName)
        {
            Assert.Throws<ArgumentException>(() =>
            {
                new CrewMember(invalidName, "AA123456", CrewRank.Officer, "PT");
            });
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void Constructor_InvalidCitizenId_ShouldThrow(string invalidCitizenId)
        {
            Assert.Throws<ArgumentException>(() =>
            {
                new CrewMember("Maria", invalidCitizenId, CrewRank.Officer, "PT");
            });
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        [InlineData("P")]
        [InlineData("PTX")]
        [InlineData("1T")]
        public void Constructor_InvalidNationality_ShouldThrow(string invalidNationality)
        {
            Assert.Throws<ArgumentException>(() =>
            {
                new CrewMember("Maria", "AA123456", CrewRank.SafetyOfficer, invalidNationality);
            });
        }

        [Fact]
        public void Nationality_ShouldBeTwoUppercaseLetters()
        {
            var crew = new CrewMember("Ana", "BB987654", CrewRank.Officer, "PT");
            Assert.Equal(2, crew.Nationality.Length);
            Assert.True(char.IsUpper(crew.Nationality[0]));
            Assert.True(char.IsUpper(crew.Nationality[1]));
        }
    }
}
