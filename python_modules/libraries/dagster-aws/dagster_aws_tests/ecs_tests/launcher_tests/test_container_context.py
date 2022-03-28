import pytest
from dagster_aws.ecs.container_context import EcsContainerContext

from dagster.core.errors import DagsterInvalidConfigError


@pytest.fixture(name="empty_container_context")
def empty_container_context_fixture():
    return EcsContainerContext()


@pytest.fixture(name="secrets_container_context")
def secrets_container_context_fixture(container_context_config):
    return EcsContainerContext.create_from_config(container_context_config)


@pytest.fixture(name="other_secrets_container_context")
def other_container_context_fixture(other_container_context_config):
    return EcsContainerContext.create_from_config(other_container_context_config)


def test_empty_container_context(empty_container_context):
    assert empty_container_context.secrets == []
    assert empty_container_context.secrets_tags == []


def test_invalid_config():
    with pytest.raises(
        DagsterInvalidConfigError, match="Errors while parsing ECS container context"
    ):
        EcsContainerContext.create_from_config(
            {"ecs": {"secrets": {"foo": "bar"}}}
        )  # invalid formatting


def test_merge(
    empty_container_context,
    secrets_container_context,
    other_secrets_container_context,
    configured_secret,
    other_configured_secret,
):
    assert secrets_container_context.secrets == [
        {"name": "HELLO", "valueFrom": configured_secret.arn + "/hello"},
    ]
    assert secrets_container_context.secrets_tags == ["dagster"]

    assert other_secrets_container_context.secrets == [
        {"name": "GOODBYE", "valueFrom": other_configured_secret.arn + "/goodbye"},
    ]

    assert other_secrets_container_context.secrets_tags == ["other_secret_tag"]

    merged = other_secrets_container_context.merge(secrets_container_context)

    assert merged.secrets == [
        {"name": "HELLO", "valueFrom": configured_secret.arn + "/hello"},
        {"name": "GOODBYE", "valueFrom": other_configured_secret.arn + "/goodbye"},
    ]

    assert merged.secrets_tags == ["dagster", "other_secret_tag"]

    assert (
        empty_container_context.merge(secrets_container_context).secrets
        == secrets_container_context.secrets
    )
    assert (
        empty_container_context.merge(secrets_container_context).secrets_tags
        == secrets_container_context.secrets_tags
    )
