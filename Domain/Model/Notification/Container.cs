namespace Domain.Model;



public class Container
{
    public long Id { get; set; }

    public string ContainerNumber { get; private set; } = string.Empty;

    private Container() { }

    public Container(string containerNumber)
    {
        if (containerNumber == null) throw new ArgumentNullException(nameof(containerNumber));
        var normalized = containerNumber.Trim().ToUpperInvariant();
        ValidateContainerNumber(normalized);
        ContainerNumber = normalized;
    }


    public void ValidateContainerNumber(string containerNumber)
        {
            if (string.IsNullOrWhiteSpace(containerNumber))
            {
                throw new ArgumentException("Container number cannot be null or empty.", nameof(containerNumber));
            }
            if (!System.Text.RegularExpressions.Regex.IsMatch(containerNumber, "^[A-Z]{4}\\d{7}$"))
            {
                throw new ArgumentException("Container number must have 4 uppercase letters followed by 7 digits (e.g., ABCU1234567).", nameof(containerNumber));
            }
        }

    
}