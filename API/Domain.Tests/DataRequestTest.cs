using System;
using Xunit;
using Domain.Model;

namespace Domain.Tests
{
    public class DataRequestTest
    {

        [Fact]
        public void Constructor_WithValidData_ShouldCreateDataRequest()
        {
            var requestType = DataRequestType.Access;
            var email = "user@example.com";
            var details = "I want to access my data";

            var dataRequest = new DataRequest(requestType, email, details);

            Assert.Equal(requestType, dataRequest.RequestType);
            Assert.Equal(email, dataRequest.SystemUserEmail);
            Assert.Equal(details, dataRequest.Details);
            Assert.Equal(DataRequestStatus.Pending, dataRequest.Status);
            Assert.True((DateTime.UtcNow - dataRequest.RequestedAt).TotalSeconds < 1);
        }

        [Theory]
        [InlineData(DataRequestType.Access)]
        [InlineData(DataRequestType.Rectification)]
        [InlineData(DataRequestType.Deletion)]
        public void Constructor_WithDifferentRequestTypes_ShouldSetCorrectType(DataRequestType requestType)
        {
            var dataRequest = new DataRequest(requestType, "user@example.com", "Details");
            Assert.Equal(requestType, dataRequest.RequestType);
        }

        [Fact]
        public void Constructor_WithNullDetails_ShouldCreateDataRequest()
        {
            var dataRequest = new DataRequest(DataRequestType.Access, "user@example.com", null);

            Assert.Null(dataRequest.Details);
            Assert.Equal(DataRequestStatus.Pending, dataRequest.Status);
        }

        [Fact]
        public void Constructor_WithEmptyDetails_ShouldCreateDataRequest()
        {
            var dataRequest = new DataRequest(DataRequestType.Access, "user@example.com", "");

            Assert.Empty(dataRequest.Details!);
        }

        [Fact]
        public void Constructor_WithWhitespaceDetails_ShouldCreateDataRequest()
        {
            var dataRequest = new DataRequest(DataRequestType.Access, "user@example.com", "   ");

            Assert.NotNull(dataRequest);
        }

        [Fact]
        public void Constructor_ShouldSetStatusToPending()
        {
            var dataRequest = new DataRequest(DataRequestType.Access, "user@example.com", "Details");

            Assert.Equal(DataRequestStatus.Pending, dataRequest.Status);
        }

        [Fact]
        public void Constructor_ShouldSetRequestedAtToCurrentUtcTime()
        {
            var beforeCreation = DateTime.UtcNow;

            var dataRequest = new DataRequest(DataRequestType.Access, "user@example.com", "Details");

            var afterCreation = DateTime.UtcNow;
            Assert.True(dataRequest.RequestedAt >= beforeCreation && dataRequest.RequestedAt <= afterCreation);
        }



        [Fact]
        public void Constructor_WithNullEmail_ShouldThrowArgumentException()
        {
            var exception = Assert.Throws<ArgumentException>(() =>
                new DataRequest(DataRequestType.Access, null!, "Details"));
            
            Assert.Equal("systemUserEmail", exception.ParamName);
            Assert.Contains("cannot be null or empty", exception.Message);
        }

        [Fact]
        public void Constructor_WithEmptyEmail_ShouldThrowArgumentException()
        {
            var exception = Assert.Throws<ArgumentException>(() =>
                new DataRequest(DataRequestType.Access, "", "Details"));
            
            Assert.Equal("systemUserEmail", exception.ParamName);
            Assert.Contains("cannot be null or empty", exception.Message);
        }

        [Fact]
        public void Constructor_WithWhitespaceEmail_ShouldThrowArgumentException()
        {
            var exception = Assert.Throws<ArgumentException>(() =>
                new DataRequest(DataRequestType.Access, "   ", "Details"));
            
            Assert.Equal("systemUserEmail", exception.ParamName);
            Assert.Contains("cannot be null or empty", exception.Message);
        }

        [Fact]
        public void Constructor_WithEmailWithoutAtSymbol_ShouldThrowArgumentException()
        {
            var exception = Assert.Throws<ArgumentException>(() =>
                new DataRequest(DataRequestType.Access, "userexample.com", "Details"));
            
            Assert.Equal("systemUserEmail", exception.ParamName);
            Assert.Contains("is not valid", exception.Message);
        }

        [Theory]
        [InlineData("user@example.com")]
        [InlineData("test.user@domain.co.uk")]
        [InlineData("user+tag@example.com")]
        [InlineData("user_name@example.com")]
        [InlineData("user123@test-domain.com")]
        public void Constructor_WithValidEmails_ShouldCreateDataRequest(string email)
        {
            var dataRequest = new DataRequest(DataRequestType.Access, email, "Details");

            Assert.Equal(email, dataRequest.SystemUserEmail);
        }

        [Fact]
        public void Constructor_WithEmailWithLeadingTrailingSpaces_ShouldTrimEmail()
        {
            // Arrange
            var emailWithSpaces = "  user@example.com  ";
            var expectedEmail = "user@example.com";

            // Act
            var dataRequest = new DataRequest(DataRequestType.Access, emailWithSpaces, "Details");

            // Assert
            Assert.Equal(expectedEmail, dataRequest.SystemUserEmail);
        }

        [Fact]
        public void Constructor_WithEmailStartingWithAt_ShouldThrowArgumentException()
        {
            // Act & Assert
            var exception = Assert.Throws<ArgumentException>(() =>
                new DataRequest(DataRequestType.Access, "@example.com", "Details"));
            
            Assert.Equal("systemUserEmail", exception.ParamName);
            Assert.Contains("is not valid", exception.Message);
        }

        [Fact]
        public void Constructor_WithEmailEndingWithAt_ShouldThrowArgumentException()
        {
            // Act & Assert
            var exception = Assert.Throws<ArgumentException>(() =>
                new DataRequest(DataRequestType.Access, "user@", "Details"));
            
            Assert.Equal("systemUserEmail", exception.ParamName);
            Assert.Contains("is not valid", exception.Message);
        }

        [Fact]
        public void Constructor_WithOnlyAtSymbol_ShouldThrowArgumentException()
        {
            // Act & Assert
            var exception = Assert.Throws<ArgumentException>(() =>
                new DataRequest(DataRequestType.Access, "@", "Details"));
            
            Assert.Equal("systemUserEmail", exception.ParamName);
            Assert.Contains("is not valid", exception.Message);
        }

        [Fact]
        public void Constructor_WithDetailsWithLeadingTrailingSpaces_ShouldTrimDetails()
        {
            // Arrange
            var detailsWithSpaces = "  Some details with spaces  ";
            var expectedDetails = "Some details with spaces";

            // Act
            var dataRequest = new DataRequest(DataRequestType.Access, "user@example.com", detailsWithSpaces);

            // Assert
            Assert.Equal(expectedDetails, dataRequest.Details);
        }

        [Fact]
        public void Constructor_WithDetailsExceeding500Characters_ShouldThrowArgumentException()
        {
            // Arrange
            var details = new string('a', 501);

            // Act & Assert
            var exception = Assert.Throws<ArgumentException>(() =>
                new DataRequest(DataRequestType.Access, "user@example.com", details));
            
            Assert.Equal("details", exception.ParamName);
            Assert.Contains("cannot exceed 500 characters", exception.Message);
        }

        [Fact]
        public void Constructor_WithDetailsExactly500Characters_ShouldCreateDataRequest()
        {
            var details = new string('a', 500);

            var dataRequest = new DataRequest(DataRequestType.Access, "user@example.com", details);

            Assert.NotNull(dataRequest);
            Assert.Equal(500, dataRequest.Details!.Length);
        }

        [Fact]
        public void Constructor_WithDetails499Characters_ShouldCreateDataRequest()
        {
            var details = new string('a', 499);

            var dataRequest = new DataRequest(DataRequestType.Access, "user@example.com", details);

            Assert.NotNull(dataRequest);
            Assert.Equal(499, dataRequest.Details!.Length);
        }

        [Fact]
        public void Constructor_WithDetailsWithSpecialCharacters_ShouldCreateDataRequest()
        {
            var details = "Special characters: !@#$%^&*()_+-=[]{}|;:',.<>?/~`";

            var dataRequest = new DataRequest(DataRequestType.Access, "user@example.com", details);

            Assert.Equal(details, dataRequest.Details);
        }

        [Fact]
        public void Constructor_WithDetailsWithUnicodeCharacters_ShouldCreateDataRequest()
        {
            var details = "Unicode: café, naïve, 日本語, émojis 😀";

            var dataRequest = new DataRequest(DataRequestType.Access, "user@example.com", details);

            Assert.Equal(details, dataRequest.Details);
        }



        [Fact]
        public void Status_CanBeSetToCompleted()
        {
            var dataRequest = new DataRequest(DataRequestType.Access, "user@example.com", "Details");

            dataRequest.Status = DataRequestStatus.Completed;

            Assert.Equal(DataRequestStatus.Completed, dataRequest.Status);
        }

        [Fact]
        public void Status_CanBeSetToRejected()
        {
            var dataRequest = new DataRequest(DataRequestType.Access, "user@example.com", "Details");

            dataRequest.Status = DataRequestStatus.Rejected;

            Assert.Equal(DataRequestStatus.Rejected, dataRequest.Status);
        }

        [Fact]
        public void Status_CanBeChangedMultipleTimes()
        {
            var dataRequest = new DataRequest(DataRequestType.Access, "user@example.com", "Details");

            Assert.Equal(DataRequestStatus.Pending, dataRequest.Status);

            dataRequest.Status = DataRequestStatus.Completed;
            Assert.Equal(DataRequestStatus.Completed, dataRequest.Status);

            dataRequest.Status = DataRequestStatus.Rejected;
            Assert.Equal(DataRequestStatus.Rejected, dataRequest.Status);

            dataRequest.Status = DataRequestStatus.Pending;
            Assert.Equal(DataRequestStatus.Pending, dataRequest.Status);
        }



        [Fact]
        public void RequestType_ShouldBeImmutable()
        {
            var dataRequest = new DataRequest(DataRequestType.Access, "user@example.com", "Details");

            Assert.Equal(DataRequestType.Access, dataRequest.RequestType);
        }

        [Fact]
        public void RequestedAt_ShouldBeImmutable()
        {
            var dataRequest = new DataRequest(DataRequestType.Access, "user@example.com", "Details");
            var originalRequestedAt = dataRequest.RequestedAt;

            System.Threading.Thread.Sleep(10);

            Assert.Equal(originalRequestedAt, dataRequest.RequestedAt);
        }

        [Fact]
        public void Details_ShouldBeImmutable()
        {
            var originalDetails = "Original details";
            var dataRequest = new DataRequest(DataRequestType.Access, "user@example.com", originalDetails);

            Assert.Equal(originalDetails, dataRequest.Details);
        }

        [Fact]
        public void SystemUserEmail_ShouldBeImmutable()
        {
            var email = "user@example.com";
            var dataRequest = new DataRequest(DataRequestType.Access, email, "Details");

            Assert.Equal(email, dataRequest.SystemUserEmail);
        }


        [Fact]
        public void MultipleDataRequests_WithSameEmail_ShouldCreateSeparateInstances()
        {
            var email = "user@example.com";

            var request1 = new DataRequest(DataRequestType.Access, email, "First request");
            var request2 = new DataRequest(DataRequestType.Deletion, email, "Second request");

            // Assert
            Assert.NotSame(request1, request2);
            Assert.Equal(email, request1.SystemUserEmail);
            Assert.Equal(email, request2.SystemUserEmail);
            Assert.NotEqual(request1.RequestType, request2.RequestType);
            Assert.NotEqual(request1.Details, request2.Details);
        }

        [Fact]
        public void DataRequest_WithAllMinimalValidData_ShouldSucceed()
        {
            var dataRequest = new DataRequest(DataRequestType.Access, "a@b.c", null);

            Assert.NotNull(dataRequest);
            Assert.Equal("a@b.c", dataRequest.SystemUserEmail);
            Assert.Null(dataRequest.Details);
        }

        [Fact]
        public void DataRequest_WithAllMaximalValidData_ShouldSucceed()
        {
            var maxEmail = new string('a', 50) + "@" + new string('b', 50) + ".com";
            var maxDetails = new string('x', 500);

            var dataRequest = new DataRequest(DataRequestType.Rectification, maxEmail, maxDetails);

            Assert.NotNull(dataRequest);
            Assert.Equal(maxEmail, dataRequest.SystemUserEmail);
            Assert.Equal(500, dataRequest.Details!.Length);
        }

        [Fact]
        public void Id_ShouldBeSettable()
        {
            var dataRequest = new DataRequest(DataRequestType.Access, "user@example.com", "Details");

            dataRequest.Id = 12345;

            Assert.Equal(12345, dataRequest.Id);
        }

        [Fact]
        public void Id_DefaultValue_ShouldBeZero()
        {
            var dataRequest = new DataRequest(DataRequestType.Access, "user@example.com", "Details");

            Assert.Equal(0, dataRequest.Id);
        }

    }
}