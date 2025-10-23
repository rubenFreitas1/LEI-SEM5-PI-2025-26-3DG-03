namespace Domain.Model
{
    public sealed class OperationalWindow
    {
        public DayOfWeek StartDay { get; }
        public DayOfWeek EndDay { get; }
        public TimeSpan StartTime { get; }
        public TimeSpan EndTime { get; }

        public OperationalWindow(DayOfWeek startDay, DayOfWeek endDay, TimeSpan startTime, TimeSpan endTime)
        {
            ValidateDays(startDay, endDay);
            ValidateTimes(startTime, endTime);

            StartDay = startDay;
            EndDay = endDay;
            StartTime = startTime;
            EndTime = endTime;
        }

        private static void ValidateDays(DayOfWeek startDay, DayOfWeek endDay)
        {
            if (startDay > endDay)
                throw new ArgumentException("EndDay cannot be before StartDay");
        }

        private static void ValidateTimes(TimeSpan startTime, TimeSpan endTime)
        {
            if (startTime < TimeSpan.Zero || startTime >= TimeSpan.FromDays(1))
                throw new ArgumentOutOfRangeException(nameof(startTime));
            if (endTime < TimeSpan.Zero || endTime > TimeSpan.FromDays(1))
                throw new ArgumentOutOfRangeException(nameof(endTime));
            if (startTime >= endTime)
                throw new ArgumentException("EndTime cannot be before StartTime");
        }
    }
}
