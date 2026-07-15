import { Component, input } from '@angular/core';
import { ValidationError } from '@angular/forms/signals';

type FieldAccessor = () => {
    touched: () => boolean;
    invalid: () => boolean;
    errors: () => readonly ValidationError[];
};

@Component({
    selector: 'app-field-errors',
    standalone: true,
    template: `
        @if (field()().touched() && field()().invalid()) {
            <ul class="field-errors">
                @for (error of field()().errors(); track error.kind) {
                    <li>{{ error.message }}</li>
                }
            </ul>
        }
    `,
    styles: [
        `
            .field-errors {
                margin: 0.25rem 0 0;
                padding-left: 1rem;
                color: var(--p-red-500);
                font-size: 0.875rem;
            }
        `
    ]
})
export class FieldErrors {
    field = input.required<FieldAccessor>();
}
