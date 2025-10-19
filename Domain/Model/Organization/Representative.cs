using System;
using System.Diagnostics.Contracts;
using System.Text.RegularExpressions;

namespace Domain.Model;

public class Representative
{
    public long Id { get; set; }

    public string? Name { get; private set; }

    public string? CitizenId { get; private set; }

    public string? Nationality { get; private set; }

    public string? Email { get; private set; }

    public string? PhoneNumber { get; private set; }

    public ShippingAgentOrganization? Organization { get; private set; }

    public DateTime LastModifiedAt { get; set; }

    private Representative() { }

    public Representative(ShippingAgentOrganization organization, string name, string citizenId, string nationality, string email, string phoneNumber)
    {
        if (organization == null)
        {
            throw new ArgumentNullException(nameof(organization), "Organization cannot be null.");
        }
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Name cannot be null or empty.", nameof(name));
        }

        if (string.IsNullOrWhiteSpace(citizenId))
        {
            throw new ArgumentException("Citizen ID cannot be null or empty.", nameof(citizenId));
        }

        if (string.IsNullOrWhiteSpace(nationality))
        {
            throw new ArgumentException("Nationality cannot be null or empty.", nameof(nationality));
        }
        if (string.IsNullOrWhiteSpace(email) && Regex.IsMatch(email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$") == false)
        {
            throw new ArgumentException("Email cannot be null or empty.", nameof(email));
        }

        if (string.IsNullOrWhiteSpace(phoneNumber))
        {
            throw new ArgumentException("Phone number cannot be null or empty.", nameof(phoneNumber));
        }

        Organization = organization;
        Name = name;
        CitizenId = citizenId;
        Nationality = nationality;
        Email = email;
        PhoneNumber = phoneNumber;
        LastModifiedAt = DateTime.UtcNow;
    }

    public void ChangeName(string newName)
    {
        if (string.IsNullOrWhiteSpace(newName))
        {
            throw new ArgumentException("Name cannot be null or empty.", nameof(newName));
        }

        Name = newName;
        LastModifiedAt = DateTime.UtcNow;
    }

    public void ChangeOrganization(ShippingAgentOrganization newOrganization)
    {
        if (newOrganization == null)
        {
            throw new ArgumentNullException(nameof(newOrganization), "Organization cannot be null.");
        }

        Organization = newOrganization;
        LastModifiedAt = DateTime.UtcNow;
    }

    public void ChangeNationality(string newNationality)
    {
        if (string.IsNullOrWhiteSpace(newNationality))
        {
            throw new ArgumentException("Nationality cannot be null or empty.", nameof(newNationality));
        }
        Nationality = newNationality;
        LastModifiedAt = DateTime.UtcNow;
    }


    public void ChangeEmail(string newEmail)
    {
        if (string.IsNullOrWhiteSpace(newEmail) && Regex.IsMatch(newEmail, @"^[^@\s]+@[^@\s]+\.[^@\s]+$") == false)
        {
            throw new ArgumentException("Email cannot be null or empty.", nameof(newEmail));
        }

        Email = newEmail;
        LastModifiedAt = DateTime.UtcNow;
    }


    public void ChangePhoneNumber(string newPhoneNumber)
    {
        if (string.IsNullOrWhiteSpace(newPhoneNumber))
        {
            throw new ArgumentException("Phone number cannot be null or empty.", nameof(newPhoneNumber));
        }

        PhoneNumber = newPhoneNumber;
        LastModifiedAt = DateTime.UtcNow;
    }


}