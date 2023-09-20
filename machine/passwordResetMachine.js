// passwordResetMachine.js
import { createMachine } from 'xstate';

const passwordResetMachine = createMachine({
  id: 'passwordReset',
  initial: 'idle',
  states: {
    idle: {
      on: {
        REQUEST_RESET: 'validatingEmail'
      }
    },
    validatingEmail: {
      on: {
        EMAIL_VALID: 'sendingEmail',
        EMAIL_INVALID: 'error'
      }
    },
    sendingEmail: {
      on: {
        EMAIL_SENT: 'awaitingUserClick',
        EMAIL_FAILED: 'error'
      }
    },
    awaitingUserClick: {
      on: {
        TOKEN_CLICKED: 'validatingToken'
      }
    },
    validatingToken: {
      on: {
        TOKEN_VALID: 'resettingPassword',
        TOKEN_INVALID: 'error'
      }
    },
    resettingPassword: {
      on: {
        PASSWORD_RESET: 'success',
        PASSWORD_RESET_FAILED: 'error'
      }
    },
    success: {
      type: 'final'
    },
    error: {
      on: {
        RETRY: 'idle'
      }
    }
  }
});

export default passwordResetMachine;
