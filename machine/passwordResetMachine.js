// passwordResetMachine.js
import { createMachine } from 'xstate';

const passwordResetMachine = createMachine({
  id: 'accountRecovery',
  type: 'parallel',
  states: {
    passwordReset: {
      initial: 'idle',
      states: {
        idle: {
          on: {
            REQUEST_PASSWORD_RESET: 'validatingEmail'
          }
        },
        validatingEmail: {
          on: {
            EMAIL_VALID: 'sendingResetLink',
            EMAIL_INVALID: 'error'
          }
        },
        sendingResetLink: {
          on: {
            LINK_SENT: 'awaitingPasswordReset',
            LINK_SEND_FAILED: 'error'
          }
        },
        awaitingPasswordReset: {
          on: {
            PASSWORD_RESET: 'passwordUpdated',
            TIMEOUT: 'error'
          }
        },
        passwordUpdated: {
          on: {
            CONTINUE: 'idle'
          }
        },
        error: {
          on: {
            RETRY_PASSWORD_RESET: 'idle'
          }
        }
      }
    },
    userIdRecovery: {
      initial: 'idle',
      states: {
        idle: {
          on: {
            REQUEST_USER_ID_RECOVERY: 'validatingEmailForUserId'
          }
        },
        validatingEmailForUserId: {
          on: {
            EMAIL_VALID: 'sendingOTP',
            EMAIL_INVALID: 'error'
          }
        },
        sendingOTP: {
          on: {
            OTP_SENT: 'awaitingOTPEntry',
            OTP_SEND_FAILED: 'error'
          }
        },
        awaitingOTPEntry: {
          on: {
            OTP_ENTERED: 'validatingOTP'
          }
        },
        validatingOTP: {
          on: {
            OTP_VALID: 'displayingUserId',
            OTP_INVALID: 'error'
          }
        },
        displayingUserId: {
          on: {
            CONTINUE: 'idle'
          }
        },
        error: {
          on: {
            RETRY_USER_ID_RECOVERY: 'idle'
          }
        }
      }
    }
  }
});

export default passwordResetMachine;
