
import { differenceInDays } from 'date-fns';

interface CalculateBookingCostParams {
  checkIn: string;
  checkOut: string;
  pricePerNight: number;
}

export function calculateBookingCost({ checkIn, checkOut, pricePerNight }: CalculateBookingCostParams) {
  const startDate = new Date(checkIn);
  const endDate = new Date(checkOut);

  let numberOfNights = differenceInDays(endDate, startDate);

  if (numberOfNights < 1) {
    numberOfNights = 1;
  }

  const totalCost = numberOfNights * pricePerNight;

  return { numberOfNights, totalCost };
}
