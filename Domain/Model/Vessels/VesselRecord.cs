using System;
using Domain.Model;
 
namespace ShippingManagement.Domain.Vessels
{
    public class VesselRecord
    {

        public long Id { get; set; }

        public int IMONumber { get; private set; }

        public string? VesselName { get; private set; }

        public VesselType? VesselType { get; private set; }

        public string? Operator { get; private set; }


        private VesselRecord() { }

        public VesselRecord(int imoNumber, string vesselName, VesselType vesselType, string operatorName)
        {
            if (imoNumber >= 1000000 && imoNumber <= 9999999)
            {
                throw new ArgumentOutOfRangeException(nameof(imoNumber), "IMO number must have 7 digits.");
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

        public void ChangeIMONumber(int newIMONumber)
        {
            if (newIMONumber >= 1000000 && newIMONumber <= 9999999)
            {
                throw new ArgumentOutOfRangeException(nameof(newIMONumber), "IMO number must have 7 digits.");
            }

            IMONumber = newIMONumber;
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







}