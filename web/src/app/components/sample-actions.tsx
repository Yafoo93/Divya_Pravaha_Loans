"use client";

import { useState } from "react";
import { Alert, Button, ConfirmationDialog, Dialog, Menu } from "./ui/actions";
import { Card } from "./ui/data-display";

export function SampleActions() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [notice, setNotice] = useState(
    "Sample actions are safe and do not change financial records.",
  );
  const [showAlert, setShowAlert] = useState(true);

  return (
    <Card className="mt-6 p-5">
      <h2 className="text-lg font-bold">Interface actions</h2>
      <p className="text-muted mt-1 text-sm">
        Reusable buttons, menu, dialog, confirmation, and alert states.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        <Button onClick={() => setDialogOpen(true)}>Open dialog</Button>
        <Button variant="secondary" onClick={() => setConfirmationOpen(true)}>
          Request confirmation
        </Button>
        <Button variant="ghost" onClick={() => setShowAlert(true)}>
          Restore alert
        </Button>
        <Button disabled>Disabled action</Button>
        <Menu
          label="More actions"
          items={[
            {
              label: "View sample record",
              onSelect: () =>
                setNotice("Sample record selected from the menu."),
            },
            {
              label: "Export preview",
              onSelect: () => setNotice("Sample export preview requested."),
            },
            {
              label: "Restricted action",
              onSelect: () => undefined,
              disabled: true,
            },
            {
              label: "Request reversal",
              onSelect: () => setConfirmationOpen(true),
              danger: true,
            },
          ]}
        />
      </div>

      <div className="mt-5 space-y-3">
        {showAlert && (
          <Alert
            title="Action notice"
            variant="info"
            onDismiss={() => setShowAlert(false)}
          >
            {notice}
          </Alert>
        )}
        <Alert title="Controls active" variant="success">
          Confirmation is required before sensitive actions.
        </Alert>
      </div>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Sample record details"
        description="This reusable dialog can contain forms, evidence, or read-only details."
      >
        <div className="flex justify-end">
          <Button onClick={() => setDialogOpen(false)}>Done</Button>
        </div>
      </Dialog>

      <ConfirmationDialog
        open={confirmationOpen}
        title="Confirm action"
        message="Confirm that you want to continue."
        confirmLabel="Confirm action"
        destructive
        onCancel={() => setConfirmationOpen(false)}
        onConfirm={() => {
          setNotice("Action confirmed successfully.");
          setShowAlert(true);
          setConfirmationOpen(false);
        }}
      />
    </Card>
  );
}
