import { describe, it, expect } from 'vitest';
import {
  createVehicle,
  getVehicleById,
  updateVehicle,
  deactivateVehicle,
  deleteVehicle
} from '../../src/services/vehicleService.js';
import Province from '../../src/models/Province.js';
import District from '../../src/models/District.js';
import PoliceStation from '../../src/models/PoliceStation.js';

// Helper to create required FK documents
async function createRefs() {
  const province = await Province.create({ name: 'Western Province', code: 'WP' });
  const district = await District.create({ name: 'Colombo', code: 'CMB', province: province._id });
  const station  = await PoliceStation.create({ name: 'Colombo Fort', code: 'CF', district: district._id, province: province._id });
  return { province, district, station };
}

function vehicleData(refs, overrides = {}) {
  return {
    registrationNumber: 'WP-1234',
    deviceId: 'DEV-001',
    driverName: 'Test Driver',
    driverNIC: '199012345678',
    driverContact: '0771234567',
    province: refs.province._id,
    district: refs.district._id,
    station: refs.station._id,
    ...overrides
  };
}

describe('VehicleService — createVehicle', () => {
  it('should create a vehicle and return it', async () => {
    const refs = await createRefs();
    const vehicle = await createVehicle(vehicleData(refs));
    expect(vehicle._id).toBeDefined();
    expect(vehicle.registrationNumber).toBe('WP-1234');
    expect(vehicle.isActive).toBe(true);
  });

  it('should throw 400 if registrationNumber is duplicate', async () => {
    const refs = await createRefs();
    await createVehicle(vehicleData(refs));

    await expect(
      createVehicle(vehicleData(refs, { deviceId: 'DEV-002', driverNIC: '199099999999' }))
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe('VehicleService — updateVehicle (mass-assignment protection)', () => {
  it('should update only whitelisted fields', async () => {
    const refs = await createRefs();
    const vehicle = await createVehicle(vehicleData(refs));

    const updated = await updateVehicle(vehicle._id, {
      driverName: 'New Driver Name',
      // These should be ignored (not in whitelist for update)
      __v: 999,
      isActive: false   // can't change isActive through update — only through deactivate
    });

    expect(updated.driverName).toBe('New Driver Name');
    expect(updated.isActive).toBe(true); // should be unchanged
  });

  it('should throw 404 for non-existent vehicle', async () => {
    await expect(
      updateVehicle('000000000000000000000000', { driverName: 'X' })
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('VehicleService — deactivateVehicle', () => {
  it('should set isActive to false', async () => {
    const refs = await createRefs();
    const vehicle = await createVehicle(vehicleData(refs));

    const deactivated = await deactivateVehicle(vehicle._id);
    expect(deactivated.isActive).toBe(false);
  });

  it('should throw 404 for non-existent vehicle', async () => {
    await expect(
      deactivateVehicle('000000000000000000000000')
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('VehicleService — deleteVehicle', () => {
  it('should delete the vehicle', async () => {
    const refs = await createRefs();
    const vehicle = await createVehicle(vehicleData(refs));

    await expect(deleteVehicle(vehicle._id)).resolves.not.toThrow();
    await expect(getVehicleById(vehicle._id)).rejects.toMatchObject({ statusCode: 404 });
  });
});
