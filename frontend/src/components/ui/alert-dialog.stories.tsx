import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from './alert-dialog';
import { Button } from './button';

const meta: Meta<typeof AlertDialog> = {
  title: 'UI/AlertDialog',
  component: AlertDialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    
    return (
      <>
        <Button onClick={() => setOpen(true)}>Abrir diálogo</Button>
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Esto eliminará permanentemente el archivo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction>Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  },
};

export const BulkDelete: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    
    return (
      <>
        <Button variant="destructive" onClick={() => setOpen(true)}>
          Eliminar 5 archivos
        </Button>
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar múltiples archivos</AlertDialogTitle>
              <AlertDialogDescription>
                Vas a eliminar 5 archivos. Esta acción no se puede deshacer y 
                todos los archivos seleccionados serán eliminados permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction>Eliminar 5 archivos</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  },
};

export const DocumentGeneration: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    
    return (
      <>
        <Button onClick={() => setOpen(true)}>Generar documento</Button>
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Generar documento</AlertDialogTitle>
              <AlertDialogDescription>
                Esto iniciará la generación automática del documento usando IA. 
                El proceso puede tardar varios minutos dependiendo de la complejidad.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction className="bg-blue-600 hover:bg-blue-700">
                Generar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  },
};