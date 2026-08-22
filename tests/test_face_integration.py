from backend.app import app


def test_face_verification_route_is_registered():
    routes = {rule.rule for rule in app.url_map.iter_rules()}
    assert "/api/screenings/<screening_id>/face" in routes


def test_run_screening_accepts_presented_face_parameter():
    from backend import run_screening
    import inspect

    source = inspect.getsource(run_screening.run_screening)
    assert "presented_face" in source
    assert "run_screening_pipeline" in source
