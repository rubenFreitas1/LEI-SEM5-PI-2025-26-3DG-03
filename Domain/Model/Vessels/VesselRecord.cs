using System;
using System.Diagnostics.Contracts;

namespace Domain.Model;

public class VesselRecord
{

    public long Id { get; set; }

    public string? IMONumber { get; private set; }

    public string? VesselName { get; private set; }

    public VesselType? VesselType { get; private set; }

    public string? Operator { get; private set; }


    private VesselRecord() { }

    public VesselRecord(string imoNumber, string vesselName, VesselType vesselType, string operatorName)
    {
        if (string.IsNullOrWhiteSpace(imoNumber) || imoNumber.Length != 7 || !imoNumber.All(char.IsDigit))
        {
            throw new ArgumentOutOfRangeException(nameof(imoNumber), "IMO number must have exactly 7 digits.");
        }
        if(CheckImoNumber(imoNumber) == false)
        {
            throw new ArgumentException("Invalid IMO number: check digit does not match.", nameof(imoNumber));
        }

        if (string.IsNullOrWhiteSpace(vesselName))
            {
                throw new ArgumentException("Vessel name cannot be null or empty.", nameof(VesselName));
            }

        if (vesselType == null)
        {
            throw new ArgumentNullException(nameof(vesselType), "Vessel type cannot be null.");
        }

        if (string.IsNullOrWhiteSpace(operatorName))
        {
            throw new ArgumentException("Operator name cannot be null or empty.", nameof(operatorName));
        }

        IMONumber = imoNumber;
        VesselName = vesselName;
        VesselType = vesselType;
        Operator = operatorName;
    }
    
    public bool CheckImoNumber(string imoNumber)
    {
        int result = 0;

        for (int i = 0; i < 6; i++)
        {
            int digit = imoNumber[i] - '0';
            int multiplier = 7 - i;
            result += digit * multiplier;
        }
        
        int calculatedCheckDigit = result % 10;
        int actualCheckDigit = imoNumber[6] - '0';
        
        return calculatedCheckDigit == actualCheckDigit;
    }

    public void ChangeVesselName(string newVesselName)
    {
        if (string.IsNullOrWhiteSpace(newVesselName))
        {
            throw new ArgumentException("Vessel name cannot be null or empty.", nameof(newVesselName));
        }

        VesselName = newVesselName;
    }

    public void ChangeVesselType(VesselType newVesselType)
    {
        if (newVesselType == null)
        {
            throw new ArgumentNullException(nameof(newVesselType), "Vessel type cannot be null.");
        }

        VesselType = newVesselType;
    }

    public void ChangeOperator(string newOperator)
    {
        if (string.IsNullOrWhiteSpace(newOperator))
        {
            throw new ArgumentException("Operator name cannot be null or empty.", nameof(newOperator));
        }

        Operator = newOperator;
    }


}
