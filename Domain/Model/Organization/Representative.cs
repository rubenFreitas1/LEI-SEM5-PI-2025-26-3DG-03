using System;
using System.Diagnostics.Contracts;
using System.Text.RegularExpressions;
using System.ComponentModel.DataAnnotations;

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
        CheckOrganization(organization);
        CheckName(name);
        if (string.IsNullOrWhiteSpace(citizenId))
        {
            throw new ArgumentException("Citizen ID cannot be null or empty.", nameof(citizenId));
        }
        citizenId = citizenId.ToUpper().Trim();
        if (string.IsNullOrWhiteSpace(nationality))
        {
            throw new ArgumentException("Nationality cannot be null or empty.", nameof(nationality));
        }
        nationality = nationality.ToUpper().Trim();
        CheckNationality(nationality);
        if (string.IsNullOrWhiteSpace(email))
        {
            throw new ArgumentException("Email cannot be null or empty.", nameof(email));
        }
        email = email.ToLower().Trim();
        CheckEmail(email);
        if (string.IsNullOrWhiteSpace(phoneNumber))
        {
            throw new ArgumentException("Phone number cannot be null or empty.", nameof(phoneNumber));
        }
        phoneNumber = phoneNumber.Trim();
        CheckPhoneNumber(phoneNumber);

        Organization = organization;
        Name = name;
        CitizenId = citizenId;
        Nationality = nationality;
        Email = email;
        PhoneNumber = phoneNumber;
        LastModifiedAt = DateTime.UtcNow;
    }

    public void CheckOrganization(ShippingAgentOrganization organization)
    {
        if (organization == null)
        {
            throw new ArgumentNullException(nameof(organization), "Organization cannot be null.");
        }
    }

    public void CheckName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Name cannot be null or empty.", nameof(name));
        }
    }

    public void CheckNationality(string nationality)
    {
        if (nationality.Length != 2)
        {
            throw new ArgumentException("Nationality must be exactly 2 characters long. E.g PT", nameof(nationality));
        }
        if (!nationality.All(char.IsLetter))
        {
            throw new ArgumentException("Nationality must contain only letters. E.g PT", nameof(nationality));
        }
    }

    public void CheckEmail(string email)
    {
        var validator = new EmailAddressAttribute();
        if (!validator.IsValid(email))
        {
            throw new ArgumentException("Email format is invalid.", nameof(email));
        }
    }

    public void CheckPhoneNumber(string phoneNumber)
    {
        if (!phoneNumber.All(char.IsDigit))
        {
            throw new ArgumentException("Phone number must contain only digits.", nameof(phoneNumber));
        }
        if (phoneNumber.Length != 9)
        {
            throw new ArgumentException("Phone number must be 9 digits long.", nameof(phoneNumber));
        }
    }
    
    public void ChangeName(string newName)
    {
        if (string.IsNullOrWhiteSpace(newName))
        {
            throw new ArgumentException("Name cannot be null or empty.", nameof(newName));
        }
        CheckName(newName);

        Name = newName;
        LastModifiedAt = DateTime.UtcNow;
    }

    public void ChangeOrganization(ShippingAgentOrganization newOrganization)
    {
        if (newOrganization == null)
        {
            throw new ArgumentNullException(nameof(newOrganization), "Organization cannot be null.");
        }
        CheckOrganization(newOrganization);

        Organization = newOrganization;
        LastModifiedAt = DateTime.UtcNow;
    }

    public void ChangeNationality(string newNationality)
    {
        if (string.IsNullOrWhiteSpace(newNationality))
        {
            throw new ArgumentException("Nationality cannot be null or empty.", nameof(newNationality));
        }
        newNationality = newNationality.ToUpper().Trim();
        CheckNationality(newNationality);

        Nationality = newNationality;
        LastModifiedAt = DateTime.UtcNow;
    }


    public void ChangeEmail(string newEmail)
    {
        if (string.IsNullOrWhiteSpace(newEmail))
        {
            throw new ArgumentException("Email cannot be null or empty.", nameof(newEmail));
        }
        newEmail = newEmail.ToLower().Trim();
        CheckEmail(newEmail);

        Email = newEmail;
        LastModifiedAt = DateTime.UtcNow;
    }


    public void ChangePhoneNumber(string newPhoneNumber)
    {
        if (string.IsNullOrWhiteSpace(newPhoneNumber))
        {
            throw new ArgumentException("Phone number cannot be null or empty.", nameof(newPhoneNumber));
        }
        newPhoneNumber = newPhoneNumber.Trim();
        CheckPhoneNumber(newPhoneNumber);

        PhoneNumber = newPhoneNumber;
        LastModifiedAt = DateTime.UtcNow;
    }


}