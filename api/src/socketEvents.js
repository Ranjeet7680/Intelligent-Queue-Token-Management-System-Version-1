// small helper to emit socket events
module.exports = (io) => {
  return {
    emitQueueUpdated: (counterId, payload) => {
      io.to(`counter:${counterId}`).emit('queue:updated', payload);
      io.to('branch:all').emit('queue:updated', payload);
    },
    emitTokenCalled: (counterId, payload) => {
      io.to(`counter:${counterId}`).emit('token:called', payload);
      io.to('kiosk:all').emit('token:called', payload);
    }
  };
};
