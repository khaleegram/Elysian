
'use client';

// Defines the context for a Firestore security rule violation
export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  requestResourceData?: any; // The data being sent in a write request
};

// A custom error class for Firestore permission errors
export class FirestorePermissionError extends Error {
  context: SecurityRuleContext;

  constructor(context: SecurityRuleContext) {
    const message = `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:\n${JSON.stringify(context, null, 2)}`;
    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;
    
    // This is necessary for extending a built-in class like Error
    Object.setPrototypeOf(this, FirestorePermissionError.prototype);
  }
}
