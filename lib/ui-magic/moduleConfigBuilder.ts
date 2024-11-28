import { z } from 'zod';
import { ReactNode } from 'react';

type ModuleComponent = (params: any) => Promise<ReactNode> | ReactNode;

export class ModuleConfigBuilder {
    private name: string;
    private description: string;
    private parameters: z.ZodObject<any>;
    private component: ModuleComponent | null;
    private visibility?: () => boolean;

    constructor(name: string) {
        this.name = name;
        this.description = '';
        this.parameters = z.object({});
        this.component = null;
    }

    setDescription(description: string) {
        this.description = description;
        return this;
    }

    setParameters(paramsSchema: z.ZodObject<any>) {
        this.parameters = paramsSchema;
        return this;
    }

    setComponent(component: ModuleComponent) {
        this.component = component;
        return this;
    }

    setVisibility(rule: () => boolean) {
        this.visibility = rule;
        return this;
    }

    build() {
        if (!this.component) {
            throw new Error(`Module "${this.name}" must have a component defined`);
        }

        return {
            name: this.name,
            description: this.description,
            parameters: this.parameters,
            component: this.component,
            visibility: this.visibility || (() => true),
        };
    }
}