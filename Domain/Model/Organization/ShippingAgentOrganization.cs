using System;
using System.Diagnostics.Contracts;

namespace Domain.Model;


public class ShippingAgentOrganization
{
    public long Id { get; set; }

    public string? Code { get; private set; }

    public string? LegalName { get; private set; }

    public string? AlternativeName { get; private set; }

    public string? Address { get; private set; }

    public string? TaxNumber { get; private set; }

    public DateTime LastModifiedAt { get; set; }


    private ShippingAgentOrganization() { }

    public ShippingAgentOrganization(string code, string legalName, string alternativeName, string address, string taxNumber)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            throw new ArgumentException("Organization code cannot be null or empty.", nameof(code));
        }

        if (string.IsNullOrWhiteSpace(legalName))
        {
            throw new ArgumentException("Legal name cannot be null or empty.", nameof(legalName));
        }

        if (string.IsNullOrWhiteSpace(alternativeName))
        {
            throw new ArgumentException("Alternative name cannot be null or empty.", nameof(alternativeName));
        }

        if (string.IsNullOrWhiteSpace(address))
        {
            throw new ArgumentException("Address cannot be null or empty.", nameof(address));
        }

        if (string.IsNullOrWhiteSpace(taxNumber))
        {
            throw new ArgumentException("Tax number cannot be null or empty.", nameof(taxNumber));
        }

        Code = code;
        LegalName = legalName;
        AlternativeName = alternativeName;
        Address = address;
        TaxNumber = taxNumber;
        LastModifiedAt = DateTime.UtcNow;
    }

    public void ChangeLegalName(string newLegalName)
    {
        if (string.IsNullOrWhiteSpace(newLegalName))
        {
            throw new ArgumentException("Legal name cannot be null or empty.", nameof(newLegalName));
        }

        LegalName = newLegalName;
        LastModifiedAt = DateTime.UtcNow;
    }

    public void ChangeAlternativeName(string newAlternativeName)
    {
        if (string.IsNullOrWhiteSpace(newAlternativeName))
        {
            throw new ArgumentException("Alternative name cannot be null or empty.", nameof(newAlternativeName));
        }

        AlternativeName = newAlternativeName;
        LastModifiedAt = DateTime.UtcNow;
    }

    public void ChangeAddress(string newAddress)
    {
        if (string.IsNullOrWhiteSpace(newAddress))
        {
            throw new ArgumentException("Address cannot be null or empty.", nameof(newAddress));
        }

        Address = newAddress;
        LastModifiedAt = DateTime.UtcNow;
    }

    public void ChangeTaxNumber(string newTaxNumber)
    {
        if (string.IsNullOrWhiteSpace(newTaxNumber))
        {
            throw new ArgumentException("Tax number cannot be null or empty.", nameof(newTaxNumber));
        }

        TaxNumber = newTaxNumber;
        LastModifiedAt = DateTime.UtcNow;
    }
    
}