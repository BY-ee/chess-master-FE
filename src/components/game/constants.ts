export const BOARD_THEME = {
  dark: { backgroundColor: '#769656' },
  light: { backgroundColor: '#eeeed2' },
};

export const ANIMATION_DURATION = 200;

export const OBSERVER_DELAY = 1000;

export const SOCKET_EVENTS = {
  JOIN_GAME: 'join_game',
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  GAME_READY: 'game_ready',
  MOVE_MADE: 'move_made',
  GAME_ENDED: 'game_ended',
  REMATCH_REQUESTED: 'rematch_requested',
  GAME_RESTARTED: 'game_restarted',
  REMATCH_DECLINED: 'rematch_declined',
  DRAW_OFFERED: 'draw_offered',
  DRAW_DECLINED: 'draw_declined',
  GAME_START: 'game_start',
  ERROR: 'error',
  LEAVE_GAME: 'leave_game',
  MAKE_MOVE: 'make_move',
  REQUEST_REMATCH: 'request_rematch',
  ACCEPT_REMATCH: 'accept_rematch',
  DECLINE_REMATCH: 'decline_rematch',
  RESIGN_GAME: 'resign_game',
  OFFER_DRAW: 'offer_draw',
  ACCEPT_DRAW: 'accept_draw',
  DECLINE_DRAW: 'decline_draw',
  GAME_END: 'game_end',
} as const;
