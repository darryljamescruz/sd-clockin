import CheckIn from '../models/CheckIn.js';
import Student from '../models/Student.js';
import Term from '../models/Term.js';
import Shift from '../models/Shift.js';
import type {
  CheckIn as CheckInType,
  CreateCheckInDto,
  UpdateCheckInDto,
  CheckInQueryParams,
} from '@sd-clockin/shared';

/**
 * Service for check-in related business logic
 */
export class CheckInsService {
  /**
   * Get check-ins with optional filters
   */
  async getCheckIns(params?: CheckInQueryParams): Promise<CheckInType[]> {
    interface MongoQuery {
      studentId?: string;
      termId?: string;
      timestamp?: {
        $gte?: Date;
        $lte?: Date;
      };
    }

    const query: MongoQuery = {};

    if (params?.studentId) query.studentId = params.studentId;
    if (params?.termId) query.termId = params.termId;

    if (params?.startDate || params?.endDate) {
      query.timestamp = {};
      if (params.startDate) query.timestamp.$gte = new Date(params.startDate);
      if (params.endDate) query.timestamp.$lte = new Date(params.endDate);
    }

    const checkIns = await CheckIn.find(query)
      .sort({ timestamp: -1 })
      .populate('studentId', 'name iso role')
      .lean();

    return checkIns.map((checkIn) => ({
      id: checkIn._id.toString(),
      studentId: checkIn.studentId.toString(),
      termId: checkIn.termId.toString(),
      type: checkIn.type,
      timestamp: checkIn.timestamp.toISOString(),
      isManual: checkIn.isManual,
    }));
  }

  /**
   * Create a new check-in
   */
  async createCheckIn(data: CreateCheckInDto): Promise<CheckInType> {
    // Verify student and term exist
    const student = await Student.findById(data.studentId);
    const term = await Term.findById(data.termId);

    if (!student) {
      throw new Error('Student not found');
    }

    if (!term) {
      throw new Error('Term not found');
    }

    const newCheckIn = new CheckIn({
      studentId: data.studentId,
      termId: data.termId,
      type: data.type,
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      isManual: data.isManual || false,
    });

    const savedCheckIn = await newCheckIn.save();

    // Update or create shift
    await this.updateShiftFromCheckIn(savedCheckIn);

    return {
      id: savedCheckIn._id.toString(),
      studentId: savedCheckIn.studentId.toString(),
      termId: savedCheckIn.termId.toString(),
      type: savedCheckIn.type,
      timestamp: savedCheckIn.timestamp.toISOString(),
      isManual: savedCheckIn.isManual,
    };
  }

  /**
   * Update a check-in
   */
  async updateCheckIn(id: string, data: UpdateCheckInDto): Promise<CheckInType> {
    const checkIn = await CheckIn.findById(id);
    if (!checkIn) {
      throw new Error('Check-in not found');
    }

    if (data.timestamp) {
      checkIn.timestamp = new Date(data.timestamp);
    }

    if (data.type) {
      checkIn.type = data.type;
    }

    checkIn.isManual = true; // Mark as manual since it's being edited
    const updatedCheckIn = await checkIn.save();

    // Update shift if it exists
    await this.updateShiftFromCheckIn(updatedCheckIn);

    return {
      id: updatedCheckIn._id.toString(),
      studentId: updatedCheckIn.studentId.toString(),
      termId: updatedCheckIn.termId.toString(),
      type: updatedCheckIn.type,
      timestamp: updatedCheckIn.timestamp.toISOString(),
      isManual: updatedCheckIn.isManual,
    };
  }

  /**
   * Delete a check-in
   */
  async deleteCheckIn(id: string): Promise<void> {
    const checkIn = await CheckIn.findByIdAndDelete(id);
    if (!checkIn) {
      throw new Error('Check-in not found');
    }
  }

  /**
   * Update or create shift based on check-in
   */
  private async updateShiftFromCheckIn(checkIn: {
    studentId: unknown;
    termId: unknown;
    timestamp: Date;
    type: 'in' | 'out';
  }): Promise<void> {
    const checkInDate = new Date(checkIn.timestamp);
    const shiftDate = new Date(
      Date.UTC(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate())
    );

    let shift = await Shift.findOne({
      studentId: checkIn.studentId,
      termId: checkIn.termId,
      date: shiftDate,
    });

    if (!shift) {
      shift = new Shift({
        studentId: checkIn.studentId,
        termId: checkIn.termId,
        date: shiftDate,
        status: checkIn.type === 'in' ? 'started' : 'scheduled',
        source: 'manual',
      });
    }

    if (checkIn.type === 'in') {
      shift.status = 'started';
      shift.actualStart = checkIn.timestamp;
    } else if (checkIn.type === 'out') {
      shift.status = 'completed';
      shift.actualEnd = checkIn.timestamp;
    }

    await shift.save();
  }
}

export default new CheckInsService();

