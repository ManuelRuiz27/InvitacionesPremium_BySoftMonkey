import { EventStatus } from '../../core/models/event.model';
import { InvitationStatus } from '../../core/models/invitation.model';

export interface StatusMeta {
  label: string;
  icon: string;
  className: string;
}

const EVENT_STATUS_META: Record<EventStatus, StatusMeta> = {
  [EventStatus.DRAFT]: {
    label: 'Listo para enviar',
    icon: 'pending',
    className: 'status-ready'
  },
  [EventStatus.PUBLISHED]: {
    label: 'Enviado',
    icon: 'send',
    className: 'status-sent'
  },
  [EventStatus.CLOSED]: {
    label: 'Cerrado',
    icon: 'event_busy',
    className: 'status-closed'
  },
  [EventStatus.BLOCKED]: {
    label: 'Bloqueado',
    icon: 'block',
    className: 'status-blocked'
  }
};

const INVITATION_STATUS_META: Record<InvitationStatus, StatusMeta> = {
  [InvitationStatus.PENDING]: {
    label: 'Listo para enviar',
    icon: 'pending',
    className: 'status-ready'
  },
  [InvitationStatus.SENT]: {
    label: 'Enviado',
    icon: 'send',
    className: 'status-sent'
  },
  [InvitationStatus.PENDING_DELIVERY]: {
    label: 'En proceso',
    icon: 'schedule',
    className: 'status-processing'
  },
  [InvitationStatus.DELIVERED]: {
    label: 'Entregado',
    icon: 'check_circle',
    className: 'status-success'
  },
  [InvitationStatus.BOUNCED]: {
    label: 'Rebotado',
    icon: 'report',
    className: 'status-warning'
  },
  [InvitationStatus.FAILED]: {
    label: 'Fallido',
    icon: 'error',
    className: 'status-danger'
  }
};

export function getEventStatusMeta(status?: EventStatus): StatusMeta {
  if (!status) {
    return EVENT_STATUS_META[EventStatus.DRAFT];
  }
  return EVENT_STATUS_META[status] ?? EVENT_STATUS_META[EventStatus.DRAFT];
}

export function getInvitationStatusMeta(status?: InvitationStatus): StatusMeta {
  if (!status) {
    return INVITATION_STATUS_META[InvitationStatus.PENDING];
  }
  return INVITATION_STATUS_META[status] ?? INVITATION_STATUS_META[InvitationStatus.PENDING];
}
