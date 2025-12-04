

namespace Domain.Model;


public class OperationPlan
{
    public long Id { get; set; }

    public List<OperationEntry>? OperationList { get; private set; }

    public DateTime TargetDay { get; private set; }

    public string? Author { get; private set; }

    public string? Algorithm { get; private set; }

    public DateTime CreatedAt { get; private set; }
    public DateTime LastModifiedAt { get; set; } 


    private OperationPlan() { }

    public OperationPlan(List<OperationEntry> list, DateTime targetDay, string author, string algorithm,  DateTime createdAt)
    {
        ValidateAuthor(author);
        ValidateAlgorithm(algorithm);
        validateList(list);

        OperationList = list;
        TargetDay = targetDay;
        Author = author;
        Algorithm = algorithm;
        CreatedAt = createdAt;
        LastModifiedAt = DateTime.UtcNow;
    }

    public void ValidateAuthor(string author, string paramName = "author")
    {
        if (string.IsNullOrWhiteSpace(author))
        {
            throw new ArgumentException("Author cannot be null or empty.", paramName);
        }
    }

    public void ValidateAlgorithm(string algorithm, string paramName = "algorithm")
    {
        if (string.IsNullOrWhiteSpace(algorithm))
        {
            throw new ArgumentException("Algorithm cannot be null or empty.", paramName);
        }
    }

    public void validateList(List<OperationEntry> list, string paramName = "list")
    {
        if (list == null || list.Count == 0)
        {
            throw new ArgumentException("Operation list cannot be null or empty.", paramName);
        }
    }

    public void ChangeAlgorithm(string newAlgorithm)
    {
        ValidateAlgorithm(newAlgorithm, "newAlgorithm");
        Algorithm = newAlgorithm;
        LastModifiedAt = DateTime.UtcNow;
    }

    public void ChangeAuthor(string newAuthor)
    {
        ValidateAuthor(newAuthor, "newAuthor");
        Author = newAuthor;
        LastModifiedAt = DateTime.UtcNow;
    }

    public void ChangeOperationList(List<OperationEntry> newList)
    {
        validateList(newList, "newList");
        OperationList = newList;
        LastModifiedAt = DateTime.UtcNow;
    }

    public void ChangeTargetDay(DateTime? newTargetDay)
    {
        if (!newTargetDay.HasValue)
        {
            throw new ArgumentException("Target day cannot be null.", "newTargetDay");
        }

        TargetDay = newTargetDay.Value;
        LastModifiedAt = DateTime.UtcNow;
    }

}