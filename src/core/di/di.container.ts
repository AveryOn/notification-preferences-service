import 'reflect-metadata'

import type { DiContainerPort } from '~/core/di/ports/di.container.port'
import type {
  ClassConstructor,
  ClassDiProvider,
  DiProvider,
  DiToken,
  FactoryDiProvider,
  InjectMetadata,
  ValueDiProvider
} from '~/core/di/types'

const INJECT_METADATA_KEY = Symbol.for('di:inject')
const INJECTABLE_METADATA_KEY = Symbol.for('di:injectable')

export class DiContainer implements DiContainerPort {
  private readonly providers = new Map<DiToken, DiProvider>()
  private readonly instances = new Map<DiToken, unknown>()

  register(provider: DiProvider): void
  register(providers: DiProvider[]): void
  register(providerOrProviders: DiProvider | DiProvider[]): void {
    const providers = Array.isArray(providerOrProviders)
      ? providerOrProviders
      : [providerOrProviders]

    for (const provider of providers) {
      console.log('Provider Register:', provider.token)
      this.providers.set(provider.token, provider)
    }
  }

  resolve<T = unknown>(token: DiToken): T {
    if (this.instances.has(token)) {
      return this.instances.get(token) as T
    }

    const provider = this.providers.get(token)

    if (!provider) {
      throw new Error(
        `Provider is not registered: ${this.formatToken(token)}`
      )
    }

    const instance = this.createInstance(provider)

    this.instances.set(token, instance)

    return instance as T
  }

  private createInstance(provider: DiProvider): unknown {
    if (this.isValueProvider(provider)) {
      return provider.useValue
    }

    if (this.isFactoryProvider(provider)) {
      const dependencies =
        provider.inject?.map((token) => this.resolve(token)) ?? []

      return provider.useFactory(...dependencies)
    }

    if (this.isClassProvider(provider)) {
      const TargetClass = provider.useClass

      if (!this.isInjectable(TargetClass)) {
        throw new Error(`Class is not injectable: ${TargetClass.name}`)
      }

      const dependencies = this.resolveClassDependencies(TargetClass)

      return new TargetClass(...dependencies)
    }

    throw new Error('Invalid DI provider')
  }

  private resolveClassDependencies(target: ClassConstructor): unknown[] {
    const metadata = this.getInjectMetadata(target)
    const dependencies: unknown[] = []

    for (const dependency of metadata) {
      dependencies[dependency.index] = this.resolve(dependency.token)
    }

    return dependencies
  }

  private getInjectMetadata(target: ClassConstructor): InjectMetadata[] {
    return (
      (Reflect.getMetadata(INJECT_METADATA_KEY, target) as
        | InjectMetadata[]
        | undefined) ?? []
    )
  }

  private isInjectable(target: ClassConstructor): boolean {
    return Reflect.getMetadata(INJECTABLE_METADATA_KEY, target) === true
  }

  private isClassProvider(
    provider: DiProvider
  ): provider is ClassDiProvider {
    return 'useClass' in provider
  }

  private isValueProvider(
    provider: DiProvider
  ): provider is ValueDiProvider {
    return 'useValue' in provider
  }

  private isFactoryProvider(
    provider: DiProvider
  ): provider is FactoryDiProvider {
    return 'useFactory' in provider
  }

  private formatToken(token: DiToken): string {
    if (typeof token === 'string') {
      return token
    }

    if (typeof token === 'symbol') {
      return token.description ?? token.toString()
    }

    if (typeof token === 'function') {
      return token.name || 'AnonymousClass'
    }

    return 'UnknownToken'
  }
}

export function Injectable(): ClassDecorator {
  return (target) => {
    Reflect.defineMetadata(INJECTABLE_METADATA_KEY, true, target)
  }
}

export function Inject(token: DiToken): ParameterDecorator {
  return (target, _propertyKey, parameterIndex) => {
    const existingMetadata =
      (Reflect.getMetadata(INJECT_METADATA_KEY, target) as
        | InjectMetadata[]
        | undefined) ?? []

    existingMetadata.push({
      index: parameterIndex,
      token
    })

    Reflect.defineMetadata(INJECT_METADATA_KEY, existingMetadata, target)
  }
}
