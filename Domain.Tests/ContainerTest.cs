using System;
using Xunit;
using Domain.Model;

namespace Domain.Tests
{
    public class ContainerTest
    {
        [Theory]
        [InlineData("CSQU3054383")]
        [InlineData("MSCU6639871")]
        [InlineData("ABCU1234567")]  
        [InlineData("TGHU0000001")] 
        public void Constructor_ValidContainerNumbers_ShouldCreate(string containerNumber)
        {
            var c = new Container(containerNumber);
            Assert.Equal(containerNumber.Trim().ToUpperInvariant(), c.ContainerNumber);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void Constructor_NullOrEmpty_ShouldThrow(string containerNumber)
        {
            if (containerNumber == null)
                Assert.Throws<ArgumentNullException>(() => new Container(containerNumber!));
            else
                Assert.Throws<ArgumentException>(() => new Container(containerNumber));
        }

        [Theory]
        [InlineData("ABCD123456")]   
        [InlineData("ABCDE1234567")]
        [InlineData("abc1234567")]   
        [InlineData("1234ABCD567")]  
        public void Constructor_InvalidFormat_ShouldThrow(string containerNumber)
        {
            Assert.Throws<ArgumentException>(() => new Container(containerNumber));
        }
    }
}
