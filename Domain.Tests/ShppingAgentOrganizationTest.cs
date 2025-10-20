using System;
using System.Collections.Generic;
using Xunit;
using Domain.Model;
using System.Runtime.InteropServices;


namespace Domain.Tests
{
    public class ShppingAgentOrganizationTest
    {
        [Theory]
        [InlineData("ORG1", "Legal Name", "Alt Name", "123 Street", "TAX123")]
        [InlineData("org2", "Another Legal Name", "Another Alt Name", "456 Avenue", "tax456")]
        public void Constructor_ValidParameters_ShouldCreate(string code, string legalName, string alternativeName, string address, string taxNumber)
        {
            var organization = new ShippingAgentOrganization(code, legalName, alternativeName, address, taxNumber);

            Assert.Equal(code.ToUpper().Trim(), organization.Code);
            Assert.Equal(legalName, organization.LegalName);
            Assert.Equal(alternativeName, organization.AlternativeName);
            Assert.Equal(address, organization.Address);
            Assert.Equal(taxNumber.ToUpper().Trim(), organization.TaxNumber);
            Assert.NotEqual(default, organization.LastModifiedAt);
        }


        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        [InlineData("code!")]
        [InlineData("space code")]
        public void Constructor_InvalidCode_ShouldThrow(string code)
        {
            Assert.Throws<ArgumentException>(() => new ShippingAgentOrganization(code, "Legal Name", "Alt Name", "123 Street", "TAX123"));
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void Constructor_InvalidLegalName_ShouldThrow(string legalName)
        {
            Assert.Throws<ArgumentException>(() => new ShippingAgentOrganization("ORG1", legalName, "Alt Name", "123 Street", "TAX123"));
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void Constructor_InvalidAlternativeName_ShouldThrow(string alternativeName)
        {
            Assert.Throws<ArgumentException>(() => new ShippingAgentOrganization("ORG1", "Legal Name", alternativeName, "123 Street", "TAX123"));
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void Constructor_InvalidAddress_ShouldThrow(string address)
        {
            Assert.Throws<ArgumentException>(() => new ShippingAgentOrganization("ORG1", "Legal Name", "Alt Name", address, "TAX123"));
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        [InlineData("tax!@#")]
        public void Constructor_InvalidTaxNumber_ShouldThrow(string taxNumber)
        {
            Assert.Throws<ArgumentException>(() => new ShippingAgentOrganization("ORG1", "Legal Name", "Alt Name", "123 Street", taxNumber));
        }

        [Fact]
        public void ChangeLegalName_Valid_ShouldUpdateAndSetLastModifiedAt()
        {
            var org = new ShippingAgentOrganization("ORG1", "Legal Name", "Alt Name", "123 Street", "TAX123");
            var before = org.LastModifiedAt;
            org.ChangeLegalName("New Legal Name");
            Assert.Equal("New Legal Name", org.LegalName);
            Assert.True(org.LastModifiedAt > before);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void ChangeLegalName_Invalid_ShouldThrow(string newLegalName)
        {
            var org = new ShippingAgentOrganization("ORG1", "Legal Name", "Alt Name", "123 Street", "TAX123");
            Assert.Throws<ArgumentException>(() => org.ChangeLegalName(newLegalName));
        }

        [Fact]
        public void ChangeAlternativeName_Valid_ShouldUpdateAndSetLastModifiedAt()
        {
            var org = new ShippingAgentOrganization("ORG1", "Legal Name", "Alt Name", "123 Street", "TAX123");
            var before = org.LastModifiedAt;
            org.ChangeAlternativeName("New Alt Name");
            Assert.Equal("New Alt Name", org.AlternativeName);
            Assert.True(org.LastModifiedAt > before);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void ChangeAlternativeName_Invalid_ShouldThrow(string newAlternativeName)
        {
            var org = new ShippingAgentOrganization("ORG1", "Legal Name", "Alt Name", "123 Street", "TAX123");
            Assert.Throws<ArgumentException>(() => org.ChangeAlternativeName(newAlternativeName));
        }

        [Fact]
        public void ChangeAddress_Valid_ShouldUpdateAndSetLastModifiedAt()
        {
            var org = new ShippingAgentOrganization("ORG1", "Legal Name", "Alt Name", "123 Street", "TAX123");
            var before = org.LastModifiedAt;
            org.ChangeAddress("New Address");
            Assert.Equal("New Address", org.Address);
            Assert.True(org.LastModifiedAt > before);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void ChangeAddress_Invalid_ShouldThrow(string newAddress)
        {
            var org = new ShippingAgentOrganization("ORG1", "Legal Name", "Alt Name", "123 Street", "TAX123");
            Assert.Throws<ArgumentException>(() => org.ChangeAddress(newAddress));
        }

        [Fact]
        public void ChangeTaxNumber_Valid_ShouldUpdateAndSetLastModifiedAt()
        {
            var org = new ShippingAgentOrganization("ORG1", "Legal Name", "Alt Name", "123 Street", "TAX123");
            var before = org.LastModifiedAt;
            org.ChangeTaxNumber("NEW123");
            Assert.Equal("NEW123", org.TaxNumber);
            Assert.True(org.LastModifiedAt > before);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        [InlineData("invalid!@#")]
        public void ChangeTaxNumber_Invalid_ShouldThrow(string newTaxNumber)
        {
            var org = new ShippingAgentOrganization("ORG1", "Legal Name", "Alt Name", "123 Street", "TAX123");
            Assert.Throws<ArgumentException>(() => org.ChangeTaxNumber(newTaxNumber));
        }
        

    }
}