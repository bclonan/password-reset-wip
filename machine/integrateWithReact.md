```
// App.js
import React from 'react';
import { useMachine } from '@xstate/react';
import passwordResetMachine from './passwordResetMachine';

function App() {
    const [state, send] = useMachine(passwordResetMachine);

    return (
        <div>
            {state.matches('idle') && <button onClick={() => send('REQUEST_RESET')}>Request Password Reset</button>}
            {state.matches('validatingEmail') && <p>Validating email...</p>}
            {state.matches('sendingEmail') && <p>Sending reset email...</p>}
            {state.matches('awaitingUserClick') && <p>Click the link in the email...</p>}
            {state.matches('validatingToken') && <p>Validating token...</p>}
            {state.matches('resettingPassword') && <p>Resetting password...</p>}
            {state.matches('success') && <p>Password reset successful!</p>}
            {state.matches('error') && <p>Error occurred. <button onClick={() => send('RETRY')}>Retry</button></p>}
        </div>
    );
}

export default App;
```