using System;
using System.Text.RegularExpressions;
using ShippingManagement.Domain.Qualifications;

namespace Domain.Model;
public abstract class Resource
{
    public long Id { get; set; }

    public string Name { get; private set; }

    public IEnumerable<Qualification> Qualification { get; private set; }

    protected Resource()
    {
        Name = string.Empty;
        Qualification = null!;
    }

    protected Resource(string name, IEnumerable<Qualification> qualification)
    {
        ValidateName(name);
        ValidateQualification(qualification);

        Name = name.Trim();
        Qualification = qualification;
    }

    private static void ValidateName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Name cannot be null or empty.", nameof(name));

        var trimmed = name.Trim();
        if (trimmed.Length > 100)
            throw new ArgumentException("Name must be at most 100 characters long.", nameof(name));

        if (!Regex.IsMatch(trimmed, @"^[A-Za-z0-9\s\-_,.]+$"))
            throw new ArgumentException("Name contains invalid characters.", nameof(name));

        if (!char.IsUpper(trimmed[0]))
            throw new ArgumentException("Name must start with an uppercase letter.", nameof(name));
    }

    private static void ValidateQualification(IEnumerable<Qualification> qualification)
    {
        if (qualification is null)
            throw new ArgumentNullException(nameof(qualification), "Qualification cannot be null.");
    }
}
