using System;
using System.Collections.Generic;
using Xunit;
using Domain.Model;
using System.Runtime.InteropServices;


namespace Domain.Tests
{
    public class RepresentativeTest
    {
        private ShippingAgentOrganization CreateOrganization(long id = 1, string code = "ORG1", string legalName = "Legal Name", string alternativeName = "Alt Name", string address = "123 Street", string taxNumber = "TAX123")
        {
            var organization = new ShippingAgentOrganization(code, legalName, alternativeName, address, taxNumber);
            organization.Id = id;
            return organization;
        }

        [Theory]
        [InlineData("John Doe", "CIT123", "PT", "ola@gmail.com", "123456789")]
        [InlineData("Jane Smith", "CIT456", "pt", "OLA@GMAIL.COM", "987654321")]
        public void Constructor_ValidParameters_ShouldCreate(string name, string citizenId, string nationality, string email, string phoneNumber)
        {
            var organization = CreateOrganization(11, "ORG11", "Legal Name 11", "Alt Name 11", "456 Avenue", "TAX456");
            var rep = new Representative(organization, name, citizenId, nationality, email, phoneNumber);

            Assert.Equal(organization, rep.Organization);
            Assert.Equal(name, rep.Name);
            Assert.Equal(citizenId, rep.CitizenId);
            Assert.Equal(nationality.ToUpper(), rep.Nationality);
            Assert.Equal(email.ToLower(), rep.Email);
            Assert.Equal(phoneNumber, rep.PhoneNumber);
            Assert.NotEqual(default, rep.LastModifiedAt);
        }

        [Theory]
        [InlineData(null)]
        public void Constructor_NullOrganization_ShouldThrow(ShippingAgentOrganization organization)
        {
            Assert.Throws<ArgumentNullException>(() => new Representative(organization, "John Doe", "CIT123", "PT", "test@gmail.com", "123456789"));
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void Constructor_InvalidName_ShouldThrow(string name)
        {
            Assert.Throws<ArgumentException>(() => new Representative(CreateOrganization(), name, "CIT123", "PT", "test1@gmail.com", "123456789"));
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void Constructor_InvalidCitizenId_ShouldThrow(string citizenId)
        {
            Assert.Throws<ArgumentException>(() => new Representative(CreateOrganization(), "John Doe", citizenId, "PT", "test@gmail.com", "123456789"));
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        [InlineData("P")]
        [InlineData("PTA")]
        [InlineData("P1")]
        public void Constructor_InvalidNationality_ShouldThrow(string nationality)
        {
            Assert.Throws<ArgumentException>(() => new Representative(CreateOrganization(), "John Doe", "CIT123", nationality, "test@gmail.com", "123456789"));
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        [InlineData("invalidemail")]
        public void Constructor_InvalidEmail_ShouldThrow(string email)
        {
            Assert.Throws<ArgumentException>(() => new Representative(CreateOrganization(), "John Doe", "CIT123", "PT", email, "123456789"));
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        [InlineData("12345")]
        [InlineData("1234567890")]
        public void Constructor_InvalidPhoneNumber_ShouldThrow(string phoneNumber)
        {
            Assert.Throws<ArgumentException>(() => new Representative(CreateOrganization(), "John Doe", "CIT123", "PT", "test@gmail.com", phoneNumber));
        }


        [Fact]
        public void ChangeOrganization_Valid_ShouldUpdateAndSetLastModifiedAt()
        {
            var org1 = CreateOrganization(1, "ORG1", "Legal Name 1", "Alt Name 1", "123 Street", "TAX123");
            var org2 = CreateOrganization(2, "ORG2", "Legal Name 2", "Alt Name 2", "456 Avenue", "TAX456");
            var rep = new Representative(org1, "John Doe", "CIT123", "PT", "test@gmail.com", "123456789");
            var before = rep.LastModifiedAt;
            rep.ChangeOrganization(org2);
            Assert.Equal(org2, rep.Organization);
            Assert.True(rep.LastModifiedAt > before);
        }

        [Fact]
        public void ChangeOrganization_Null_ShouldThrow()
        {
            var org1 = CreateOrganization(1, "ORG1", "Legal Name 1", "Alt Name 1", "123 Street", "TAX123");
            var rep = new Representative(org1, "John Doe", "CIT123", "PT", "test@gmail.com", "123456789");
            Assert.Throws<ArgumentNullException>(() => rep.ChangeOrganization(null!));
        }


        [Fact]
        public void ChangeName_Valid_ShouldUpdateAndSetLastModifiedAt()
        {
            var rep = new Representative(CreateOrganization(), "John Doe", "CIT123", "PT", "test@gmail.com", "123456789");
            var before = rep.LastModifiedAt;
            rep.ChangeName("Jane Smith");
            Assert.Equal("Jane Smith", rep.Name);
            Assert.True(rep.LastModifiedAt > before);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void ChangeName_Invalid_ShouldThrow(string newName)
        {
            var rep = new Representative(CreateOrganization(), "John Doe", "CIT123", "PT", "test@gmail.com", "123456789");
            Assert.Throws<ArgumentException>(() => rep.ChangeName(newName));
        }

        [Fact]
        public void ChangeEmail_Valid_ShouldUpdateAndSetLastModifiedAt()
        {
            var rep = new Representative(CreateOrganization(), "John Doe", "CIT123", "PT", "test@gmail.com", "123456789");
            var before = rep.LastModifiedAt;
            rep.ChangeEmail("test2@gmail.com");
            Assert.Equal("test2@gmail.com", rep.Email);
            Assert.True(rep.LastModifiedAt > before);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        [InlineData("invalidemail")]
        public void ChangeEmail_Invalid_ShouldThrow(string newEmail)
        {
            var rep = new Representative(CreateOrganization(), "John Doe", "CIT123", "PT", "test@gmail.com", "123456789");
            Assert.Throws<ArgumentException>(() => rep.ChangeEmail(newEmail));
        }

        [Fact]
        public void ChangePhoneNumber_Valid_ShouldUpdateAndSetLastModifiedAt()
        {
            var rep = new Representative(CreateOrganization(), "John Doe", "CIT123", "PT", "test@gmail.com", "123456789");
            var before = rep.LastModifiedAt;
            rep.ChangePhoneNumber("987654321");
            Assert.Equal("987654321", rep.PhoneNumber);
            Assert.True(rep.LastModifiedAt > before);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        [InlineData("12345")]
        [InlineData("1234567890")]
        public void ChangePhoneNumber_Invalid_ShouldThrow(string newPhoneNumber)
        {
            var rep = new Representative(CreateOrganization(), "John Doe", "CIT123", "PT", "test@gmail.com", "123456789");
            Assert.Throws<ArgumentException>(() => rep.ChangePhoneNumber(newPhoneNumber));
        }

        [Fact]
        public void ChangeNationality_Valid_ShouldUpdateAndSetLastModifiedAt()
        {
            var rep = new Representative(CreateOrganization(), "John Doe", "CIT123", "PT", "test@gmail.com", "123456789");
            var before = rep.LastModifiedAt;
            rep.ChangeNationality("ES");
            Assert.Equal("ES", rep.Nationality);
            Assert.True(rep.LastModifiedAt > before);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        [InlineData("E")]
        [InlineData("ESP")]
        [InlineData("E1")]
        public void ChangeNationality_Invalid_ShouldThrow(string newNationality)
        {
            var rep = new Representative(CreateOrganization(), "John Doe", "CIT123", "PT", "test@gmail.com", "123456789");
            Assert.Throws<ArgumentException>(() => rep.ChangeNationality(newNationality));
        }

        
    }
}